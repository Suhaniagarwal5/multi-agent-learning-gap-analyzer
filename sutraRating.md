# 🌟 Sutra AI - Dynamic Rating & Penalty System

The Sutra Rating System is a machine-learning-inspired algorithm that evaluates a student's actual coding competency, rather than just counting the number of problems solved. The score ranges from **0 to 1000** and is dynamically recalculated based on 5 weighted pillars, alongside a strict Anti-Cheat penalty system.

## 📊 The 5 Pillars of Proficiency

The grading algorithm is mathematically designed to enforce authentic learning behaviors:

| Pillar | Weight | Description |
| :--- | :---: | :--- |
| **Proficiency** | 35% | Computed as Hard × 50, Medium × 25, Easy × 10 points. The hierarchy ensures that solving a Hard problem yields significantly higher net points than an Easy problem, even if the maximum number of hints is used. |
| **Efficiency** | 25% | Measures speed against a difficulty-adjusted baseline time, combined with the hint-to-solve ratio per problem. |
| **Consistency** | 20% | Combines the current daily streak (saturates at 14 days) and all-time longest streak (saturates at 30 days). |
| **Breadth** | 12% | Evaluates versatility. Rewards solving problems across unique categories (saturating at 8) and unique courses (out of 3). |
| **Independence** | 8% | The ratio of problems solved with zero hints. Grants a major bonus if the independent solve rate exceeds 80%. |

## 🚨 Dynamic Modifiers and Penalty System

Sutra AI does not reward brute-forcing or cheating. The system enforces strict modifiers:

1. **Multimodal Impacts:** 
   - **Lens Bonus:** Utilizing the Sutra Lens (physical-to-digital camera) awards a flat rating bonus to encourage paper-based problem solving.
   - **Voice Penalty:** Voice queries that map to direct conceptual hints are penalized identically to standard text hints to prevent system evasion.
2. **Anti-Cheat Penalty (k = 50):** Submitting copied code (detected via the silent real-time check on the Submit button) instantly applies a flat negative penalty of **50 points** to the user's score.
3. **Frequent Compounding Penalty:** If a student exhibits repeated plagiarism or anomaly triggers, a compounding multiplier is applied (e.g., 50, 75, 112...), exponentially degrading their rank to deter persistent cheating.
4. **Beginner Grace Curve:** To avoid demoralizing new learners, penalty values are dynamically scaled down by 50% for users in the lowest rating tiers (e.g., Newcomer, Learner), allowing them room to make initial mistakes.

## 🏆 Rank Tiers
Based on the final computed rating, students are assigned one of 10 competitive tiers:
- **0 - 99:** Initiate
- **100 - 199:** Learner
- **200 - 299:** Coder
- **300 - 399:** Builder
- **400 - 499:** Engineer
- **500 - 599:** Architect
- **600 - 699:** Veteran
- **700 - 799:** Expert
- **800 - 899:** Master
- **900 - 1000+:** Grandmaster