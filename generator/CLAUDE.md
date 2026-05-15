# A-Math Bingo Generator — Generator System Specification

# Project Goal

This project is a local-first symbolic equation generation engine for A-Math Bingo.

The system generates mathematically valid equations from abstract lexical patterns stored inside a SQLite database.

The goal is NOT to generate random equations blindly.

The goal is to:

* generate equations under strict structural constraints
* preserve exact lexical pattern shapes
* validate mathematical correctness
* support configurable generation rules
* support future API integration
* support deterministic and scalable generation

The initial implementation runs entirely locally.

---

# Important Mathematical Constraints

## No Parentheses

The game does NOT support parentheses.

Evaluation follows standard arithmetic precedence only:

```text
* and / before + and -
```

Operators of equal precedence evaluate left-to-right.

Examples:

```text
2+3*4=14
18/3+2=8
20-6/3=18
```

---

# Fraction Support

Fractions are fully supported.

Examples:

```text
1/3+4=13/3
2/5+1/5=3/5
10/4=5/2
```

Floating point arithmetic must NEVER be used.

All evaluations must use exact rational arithmetic.

Recommended Python module:

```python
from fractions import Fraction
```

---

# Forbidden Operations

Division by zero is forbidden.

Invalid:

```text
1/0
10/(5-5)
```

Any candidate equation containing division by zero must be rejected immediately.

---

# Token System

| Token | Meaning                                    |
| ----- | ------------------------------------------ |
| n     | digit from 1-9                             |
| z     | digit 0                                    |
| h     | heavy number from 10-20                    |
| o     | operator (+ - * / OR negative sign marker) |
| =     | equal sign                                 |
| -     | negative sign marker                       |

---

# Token Semantics

## n

Represents:

```text
1-9
```

---

## z

Represents:

```text
0
```

---

## h

Represents a standalone integer from:

```text
10-20
```

Examples:

```text
10
11
12
...
20
```

Important:

`h` is already a complete number.

It cannot combine with:

* n
* z
* h

Invalid:

```text
hn
hh
zh
```

---

# Number Composition Rules

## n and z can combine

Sequences of `n` and `z` merge into a single integer.

Examples:

```text
nzz -> 100
nzn -> 101
nnz -> 230
nzn -> 904
```

The merged sequence becomes ONE number.

---

# Maximum Number Length

Numbers composed from `n/z`:

* maximum 3 digits
* cannot begin with z

Valid:

```text
0
7
70
600
702
839
```

Invalid:

```text
00
07
000
003
020
054
```

---

# Operator System

## Supported Operators

```text
+
-
*
/
```

---

# Negative Sign Rules

Negative sign is NOT a general unary operator.

Negative signs are only allowed:

* at the beginning of the equation
* immediately after '='

Valid:

```text
-1=-1
1=-3+4
-10=5-15
```

Invalid:

```text
1+-2=-1
2*-3=-6
4/-2=-2
```

The negative sign marker counts as one operator token.

---

# Equal Sign Rules

'=' cannot connect to:

* '='
* operators

Invalid:

```text
==
+=
=*
-=
```

---

# Pattern System

The database stores abstract lexical equation patterns.

It does NOT store equations.

Example pattern:

```text
nzon=nnz
```

Represents:

```text
[n][z][operator][n]
=
[n][n][z]
```

A valid generated equation MUST:

1. preserve the exact token structure
2. be mathematically correct

Both conditions are mandatory.

---

# Important Validation Rule

The generator MUST preserve ALL tokens exactly.

Incorrect example:

```text
10+5=15
```

for:

```text
nzon=nnz
```

Why invalid:

```text
15
```

matches:

```text
nn
```

NOT:

```text
nnz
```

Therefore the lexical structure fails.

Even if the math is correct, the candidate must be rejected.

---

# Correctness Requirement

Every generated equation must satisfy:

* exact token structure
* exact arithmetic correctness
* exact operator precedence
* no illegal token adjacency
* no division by zero
* no invalid leading zero
* no invalid negative sign placement

---

# SQLite Database Schema

Database file:

```text
8tile.db
```

Main table:

```sql
patterns
```

---

# patterns Table Structure

| Column      | Type    | Meaning                    |
| ----------- | ------- | -------------------------- |
| id          | INTEGER | unique pattern id          |
| pattern     | TEXT    | lexical token pattern      |
| length      | INTEGER | total token count          |
| n_equals    | INTEGER | number of '='              |
| n_operators | INTEGER | total operator count       |
| n_heavy     | INTEGER | number of h tokens         |
| n_negative  | INTEGER | number of negative markers |
| n_digits    | INTEGER | number of n tokens         |
| n_zeros     | INTEGER | number of z tokens         |

---

# Example Database Row

Pattern:

```text
nzon=nnz
```

Metadata:

```text
length = 8
n_equals = 1
n_operators = 1
n_heavy = 0
n_negative = 0
n_digits = 4
n_zeros = 2
```

---

# Runtime Generator Responsibilities

The runtime generator must:

1. select valid patterns
2. realize tokens into concrete values
3. compose numbers
4. build expressions
5. parse expressions
6. evaluate expressions
7. validate equality
8. reject invalid candidates
9. return valid equations

---

# Generator Pipeline

```text
Pattern Selection
        ↓
Token Realization
        ↓
Number Composition
        ↓
Expression Parsing
        ↓
Rational Evaluation
        ↓
Equation Validation
        ↓
Final Equation
```

---

# Local Generator Requirements

The initial generator runs entirely locally.

No frontend or API is required initially.

The generator must support configurable filtering rules.

---

# Generator Configuration System

The generator accepts configuration constraints.

Supported configurable fields:

| Field  | Meaning              |
| ------ | -------------------- |
| length | total pattern length |
| o      | operator count       |
| h      | heavy number count   |
| z      | zero count           |
| =      | equal sign count     |

---

# Length Rules

Currently:

```text
length = 8
```

Future support must allow:

```text
8-15
```

The implementation must be future-proof.

---

# Range-Based Configuration

All configurable fields support ranges.

Examples:

```text
o = 2-4
h = 1-2
z = 0-3
```

---

# Operator Sub-Constraint System

Users can constrain specific operators.

Examples:

```text
o = 2-4
+ = 1
- = 2
```

Meaning:

* total operators requested = 2-4
* '+' must appear exactly 1 time
* '-' must appear exactly 2 times

The system must automatically infer:

```text
minimum operators = 3
maximum operators = 4
```

because:

```text
1 (+) + 2 (-) = 3 required operators already
```

---

# Dynamic Constraint Adjustment

Example:

```text
o = 5
+ = 1-3
* = 3
```

The system must infer:

```text
* already consumes 3 operators
remaining slots = 2
```

Therefore:

```text
+ can only become 1-2
```

because:

```text
3 (*) + 3 (+) = 6
```

would exceed:

```text
o = 5
```

The generator must automatically clamp impossible ranges.

---

# Constraint Solver Responsibility

The configuration layer is not simple filtering.

It is a constraint satisfaction system.

The engine must:

* normalize ranges
* infer minimums
* infer maximums
* detect impossible configurations
* clamp invalid ranges
* reject contradictory requests

---

# Suggested Internal Architecture

```text
Config Layer
        ↓
Constraint Normalizer
        ↓
Pattern Query Builder
        ↓
SQLite Pattern Filtering
        ↓
Pattern Realization
        ↓
Math Validation
```

---

# Recommended Parsing Strategy

Do NOT use Python eval().

Recommended:

* Pratt Parser
* Recursive Descent Parser
* Shunting-yard Algorithm

Reason:

* exact precedence control
* fraction support
* lexical constraints
* deterministic behavior
* future extensibility

---

# Core System Identity

This project is fundamentally:

```text
symbolic lexical equation synthesis
```

NOT random arithmetic generation.

The database represents:

```text
canonical lexical search space
```

while the runtime engine acts as:

```text
semantic realization engine
```

The generator combines:

* lexical grammar
* constraint solving
* symbolic realization
* exact arithmetic validation
* structural preservation

into a unified equation generation system.
