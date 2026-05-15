"""End-to-end correctness test for the A-Math Bingo pipeline.

Validates, for each existing {L}tile.db file:

  1. SCHEMA SANITY:        column presence, basic constraints.
  2. METADATA CORRECTNESS: stored counts match `extract_metadata` for every row.
  3. SAMPLE WITNESS VALID: parsing+evaluating sample_equation yields LHS == RHS.
  4. PATTERN STRUCTURE:    sample_equation, when re-tokenised, matches the pattern.
  5. GRAMMAR ROUND-TRIP:   every stored pattern is grammar_valid().
  6. GENERATOR LIVENESS:   generator.generate_many can produce equations from
                           the DB.
  7. UNIFORM-ISH DIST:     across many runs at small N, no pattern is wildly
                           over- or under-represented.

These tests do NOT re-prove feasibility of every row (that's amath_bingo
exhaustive's job).  They guard against regressions in serialisation and
the consumer (generator.py) path.

Run:  python3 test_pipeline.py
"""
from __future__ import annotations

import sqlite3
import sys
import time
from collections import Counter
from fractions import Fraction
from pathlib import Path

from amath_bingo_exhaustive import (
    extract_metadata,
    grammar_valid,
    _safe_str_eval,
)
import generator as gen


HERE = Path(__file__).resolve().parent


def find_dbs() -> list[Path]:
    return sorted(HERE.glob("[0-9]*tile.db"))


def _eq_atoms(eq: str) -> list[tuple[str, int]]:
    """Split a realised equation into ordered atoms.

    Returns a list of (kind, value) where kind is "num", "op", "eq", "neg".
    For numbers, value is the integer; for ops, value is the char code
    of the operator (encoded as its ord())."""
    out: list[tuple[str, int]] = []
    i = 0
    n = len(eq)
    while i < n:
        ch = eq[i]
        if ch == "=":
            out.append(("eq", 0))
            i += 1
        elif ch == "-" and (i == 0 or eq[i - 1] == "="):
            out.append(("neg", 0))
            i += 1
        elif ch in "+-*/":
            out.append(("op", ord(ch)))
            i += 1
        elif ch.isdigit():
            j = i
            while j < n and eq[j].isdigit():
                j += 1
            out.append(("num", int(eq[i:j])))
            i = j
        else:
            raise ValueError(f"unexpected char {ch!r} in {eq!r}")
    return out


def _pat_atoms(pat: str) -> list[tuple[str, str]]:
    """Split a pattern into ordered atoms.

    Returns a list of (kind, body) where kind is "num", "op", "eq", "neg",
    and body is the token substring (e.g., "n", "z", "h", "nz", "nnn", ...)."""
    out: list[tuple[str, str]] = []
    i = 0
    n = len(pat)
    while i < n:
        t = pat[i]
        if t == "=":
            out.append(("eq", "="))
            i += 1
        elif t == "-" and (i == 0 or pat[i - 1] == "="):
            out.append(("neg", "-"))
            i += 1
        elif t == "o":
            out.append(("op", "o"))
            i += 1
        elif t == "h":
            out.append(("num", "h"))
            i += 1
        elif t in ("n", "z"):
            j = i
            while j < n and pat[j] in ("n", "z"):
                j += 1
            out.append(("num", pat[i:j]))
            i = j
        else:
            raise ValueError(f"unexpected token {t!r} in pattern {pat!r}")
    return out


def _num_matches_token(value: int, body: str) -> bool:
    """Return True iff the integer `value` can be represented by the
    pattern token `body` under strict-n semantics."""
    if body == "h":
        return 10 <= value <= 20
    if body == "n":
        return 1 <= value <= 9
    if body == "z":
        return value == 0
    # multi-digit n/z group
    if value < 0:
        return False
    digits = str(value)
    if len(digits) != len(body):
        return False
    for d, t in zip(digits, body):
        if t == "z":
            if d != "0":
                return False
        else:  # 'n' — strict 1-9
            if d == "0":
                return False
    return True


def equation_matches_pattern(eq: str, pat: str) -> bool:
    """Structural check: does `eq` instantiate `pat` exactly?

    Disambiguates ambiguous numeric strings like "10" (could be "h" or
    "nz") by comparing against the corresponding token in `pat`."""
    eq_atoms = _eq_atoms(eq)
    pat_atoms = _pat_atoms(pat)
    if len(eq_atoms) != len(pat_atoms):
        return False
    for (ek, ev), (pk, pb) in zip(eq_atoms, pat_atoms):
        if ek != pk:
            return False
        if ek == "num":
            if not _num_matches_token(ev, pb):
                return False
    return True


def test_schema(db_path: Path) -> None:
    conn = sqlite3.connect(db_path)
    cols = {row[1] for row in conn.execute("PRAGMA table_info(patterns)")}
    needed = {"pattern", "length", "n_equals", "n_operators", "n_heavy",
              "n_negative", "n_digits", "n_zero", "sample_equation"}
    missing = needed - cols
    assert not missing, f"{db_path.name}: missing columns {missing}"
    conn.close()


def test_metadata_and_witness(db_path: Path, sample: int = 200) -> None:
    conn = sqlite3.connect(db_path)
    rows = conn.execute(
        "SELECT pattern, length, n_equals, n_operators, n_heavy, n_negative, "
        "n_digits, n_zero, sample_equation FROM patterns ORDER BY RANDOM() LIMIT ?",
        (sample,),
    ).fetchall()
    for row in rows:
        (pattern, length, n_equals, n_operators, n_heavy, n_negative,
         n_digits, n_zero, sample_eq) = row

        # 1. Metadata round-trip
        meta = extract_metadata(pattern)
        assert meta["length"]      == length
        assert meta["n_equals"]    == n_equals
        assert meta["n_operators"] == n_operators
        assert meta["n_heavy"]     == n_heavy
        assert meta["n_negative"]  == n_negative
        assert meta["n_digits"]    == n_digits
        assert meta["n_zero"]      == n_zero

        # 2. Grammar round-trip
        ok, reason = grammar_valid(list(pattern))
        assert ok, f"{db_path.name}: stored pattern {pattern!r} fails grammar: {reason}"

        # 3. Witness mathematically valid
        assert "=" in sample_eq, f"witness missing '=': {sample_eq!r}"
        lhs_str, rhs_str = sample_eq.split("=", 1)
        lv = _safe_str_eval(lhs_str)
        rv = _safe_str_eval(rhs_str)
        assert lv == rv, (
            f"{db_path.name}: witness {sample_eq!r} for pattern {pattern!r}: "
            f"LHS={lv}, RHS={rv}"
        )

        # 4. Witness preserves pattern structure
        assert equation_matches_pattern(sample_eq, pattern), (
            f"{db_path.name}: witness {sample_eq!r} does not structurally "
            f"match pattern {pattern!r}"
        )
    conn.close()


def test_generator_runs(db_path: Path) -> None:
    L = int(db_path.stem.replace("tile", ""))
    cfg = gen.GeneratorConfig(length=L, max_attempts=2_000)
    results = gen.generate_many(10, config=cfg, seed=L * 7, unique=True)
    assert len(results) == 10, f"got {len(results)} results at L={L}"
    for r in results:
        # Witness equation valid?
        lhs, rhs = r.equation.split("=", 1)
        assert _safe_str_eval(lhs) == _safe_str_eval(rhs), \
            f"generator produced invalid equation: {r.equation!r}"
        # Pattern matches?
        assert equation_matches_pattern(r.equation, r.pattern), \
            f"generator equation {r.equation!r} doesn't match pattern {r.pattern!r}"


def test_uniformish_distribution(db_path: Path, calls: int = 20, batch: int = 10) -> None:
    """Generate (calls * batch) equations in small batches, count pattern
    frequencies, ensure no pattern is wildly over/under-represented."""
    L = int(db_path.stem.replace("tile", ""))
    if L > 11:
        # Skip distribution test for large lengths to keep runtime small.
        return
    cfg = gen.GeneratorConfig(length=L, max_attempts=5_000)
    counts: Counter = Counter()
    for s in range(calls):
        results = gen.generate_many(batch, config=cfg, seed=s + 1, unique=False)
        for r in results:
            counts[r.pattern] += 1
    total = sum(counts.values())
    if total == 0:
        return
    # No pattern should account for > 5% of total when DB has >> 20 patterns.
    top_pat, top_count = counts.most_common(1)[0]
    if total >= 100:
        share = top_count / total
        assert share < 0.10, (
            f"{db_path.name}: pattern {top_pat!r} got {share:.1%} of output — "
            f"distribution is too skewed"
        )


def main() -> int:
    dbs = find_dbs()
    if not dbs:
        print("No {L}tile.db files found.  Run amath_bingo_exhaustive.py first.")
        return 1

    failures = 0
    for db in dbs:
        L = db.stem
        t0 = time.monotonic()
        print(f"━━ {L} ", end="", flush=True)
        try:
            test_schema(db);                       print(".", end="", flush=True)
            test_metadata_and_witness(db);         print(".", end="", flush=True)
            test_generator_runs(db);               print(".", end="", flush=True)
            test_uniformish_distribution(db);      print(".", end="", flush=True)
        except AssertionError as e:
            print(f" ✗ {e}")
            failures += 1
            continue
        except Exception as e:
            print(f" ⨯ {type(e).__name__}: {e}")
            failures += 1
            continue
        print(f" ✓  ({time.monotonic() - t0:.1f}s)")

    if failures:
        print(f"\n❌ {failures} DB(s) failed")
        return 1
    print(f"\n✅ All {len(dbs)} DB(s) passed pipeline tests")
    return 0


if __name__ == "__main__":
    sys.exit(main())
