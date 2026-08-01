# The Drift Meter — source table

Every external claim, its source, whether that source is primary or secondary, and the date last
checked. Rows marked FLAGGED are not cleared for publication: each must be pinned to a primary
source or restated as explicitly hypothetical before this leaves prototype status.

Last full pass: 30 Jul 2026 (v0.3).

---

### FLAGGED — Bednet commodity cost near $2 against a delivered cost near $4.50
- **Where:** Slate A, case 2; trap copy on the result screen.
- **Status:** Illustrative. Carries the shape of a real, well-documented gap between commodity
  and delivered cost in net distribution. The specific figures are constructed for the task.
- **Primary link:** TODO — a named campaign or evaluator report giving delivered cost per net
  including logistics and wastage.
- **Action before release:** pin the primary source, or restate the figures as explicitly hypothetical.

### FLAGGED — Chlorination access near 80% against sustained use roughly half that
- **Where:** Slate B, case 3; trap copy on the result screen.
- **Status:** Illustrative. The access-versus-use distinction is real and is the reason the case
  exists; the numbers are constructed.
- **Primary link:** TODO — follow-up study reporting measured free chlorine residual against
  installation or access rates.
- **Action before release:** as above.

### SECONDARY — The long-run income effect of deworming is contested
- **Where:** Slate A, case 3.
- **Status:** A real, ongoing dispute in development economics, stated here as a dispute rather
  than as a result. Held as secondary knowledge.
- **Primary link:** TODO — the original long-run income paper and the principal replication or
  reanalysis on the other side.
- **Action before release:** required only if a version quotes an effect size.

### SECONDARY — Vitamin A mortality benefit scales with baseline deficiency
- **Where:** Slate B, case 1.
- **Status:** Directionally well established, quantitatively illustrative. The case turns on the
  distinction, not on the magnitude.
- **Primary link:** TODO.

### PRIMARY AVAILABLE — Clio as the reference standard for privacy-preserving measurement over real usage
- **Where:** Consent screen; protocol section 1.
- **Status:** Anthropic has published on this directly.
- **Primary link:** TODO — pin the canonical Anthropic page or paper. Do not paraphrase from memory.

### PRIMARY — The reflection was served by claude-sonnet-4-5-20250929
- **Where:** Result screen; protocol section 5.
- **Status:** Verified per request. The model ID is returned by the API in the response body and
  printed verbatim on the page.
- **Checked:** every request.

### CORRECTED — Project Deal: figures right, 1-to-7 scale omitted
- **Where:** A separate document, not this build.
- **Status:** The error that caused this table to exist. Correct numbers with a missing qualifier
  is the exact class of mistake a source table catches and a careful read does not, because
  nothing in the sentence looks wrong. The primary page states the scale explicitly.
- **Action:** corrected; kept here as the standing reason for the process.
