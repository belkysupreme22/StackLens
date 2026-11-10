use stacklens_shared::*;

/// Weights assigned to each evidence type for confidence scoring.
const CONFIRMED_WEIGHT: f64 = 1.0;
const STRONG_INDICATOR_WEIGHT: f64 = 0.8;
const SUPPORTING_WEIGHT: f64 = 0.5;
const WEAK_WEIGHT: f64 = 0.2;
const CONFLICTING_WEIGHT: f64 = -0.3;

/// Calculates confidence scores from evidence items.
pub struct ConfidenceCalculator;

impl ConfidenceCalculator {
    /// Calculate a normalized confidence score (0.0–1.0) from a set of evidence items.
    pub fn calculate_score(evidence: &[Evidence]) -> f64 {
        if evidence.is_empty() {
            return 0.0;
        }

        let mut positive_sum: f64 = 0.0;
        let mut max_possible: f64 = 0.0;
        let mut conflict_penalty: f64 = 0.0;

        for e in evidence {
            let weight = match e.evidence_type {
                EvidenceType::Confirmed => CONFIRMED_WEIGHT,
                EvidenceType::StrongIndicator => STRONG_INDICATOR_WEIGHT,
                EvidenceType::Supporting => SUPPORTING_WEIGHT,
                EvidenceType::Weak => WEAK_WEIGHT,
                EvidenceType::Conflicting => CONFLICTING_WEIGHT,
            };

            if weight > 0.0 {
                positive_sum += weight;
                max_possible += CONFIRMED_WEIGHT; // max per item is 1.0
            } else {
                conflict_penalty += weight.abs();
            }
        }

        if max_possible == 0.0 {
            return 0.0;
        }

        let raw_score = (positive_sum - conflict_penalty) / max_possible;
        raw_score.clamp(0.0, 1.0)
    }

    /// Map a numeric score to a confidence level.
    pub fn score_to_level(score: f64) -> ConfidenceLevel {
        if score >= 0.85 {
            ConfidenceLevel::High
        } else if score >= 0.6 {
            ConfidenceLevel::Medium
        } else if score >= 0.3 {
            ConfidenceLevel::Low
        } else {
            ConfidenceLevel::Inconclusive
        }
    }

    /// Alias for score_to_level.
    pub fn determine_level(score: f64) -> ConfidenceLevel {
        Self::score_to_level(score)
    }

    /// Map a numeric score to a detection status.
    pub fn score_to_status(score: f64) -> DetectionStatus {
        if score >= 0.6 {
            DetectionStatus::Detected
        } else if score >= 0.3 {
            DetectionStatus::Inconclusive
        } else {
            DetectionStatus::NotDetected
        }
    }

    /// Validate and optionally adjust a detector's self-reported score
    /// against the evidence-based calculation.
    pub fn validate_score(detector_score: f64, evidence: &[Evidence]) -> f64 {
        let evidence_score = Self::calculate_score(evidence);

        // If the detector score diverges wildly from evidence, blend them
        let diff = (detector_score - evidence_score).abs();
        if diff > 0.3 {
            // Blend: favor evidence-based score but respect detector heuristics
            (evidence_score * 0.6) + (detector_score * 0.4)
        } else {
            // Trust the detector score when it aligns with evidence
            detector_score
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_evidence(evidence_type: EvidenceType) -> Evidence {
        Evidence {
            evidence_type,
            category: EvidenceCategory::NativeLibrary,
            description: "test".to_string(),
            source: "test".to_string(),
            file_path: None,
            class_name: None,
        }
    }

    #[test]
    fn test_empty_evidence() {
        assert_eq!(ConfidenceCalculator::calculate_score(&[]), 0.0);
    }

    #[test]
    fn test_confirmed_evidence() {
        let evidence = vec![make_evidence(EvidenceType::Confirmed)];
        let score = ConfidenceCalculator::calculate_score(&evidence);
        assert!((score - 1.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_mixed_evidence() {
        let evidence = vec![
            make_evidence(EvidenceType::Confirmed),
            make_evidence(EvidenceType::Supporting),
        ];
        let score = ConfidenceCalculator::calculate_score(&evidence);
        // (1.0 + 0.5) / 2.0 = 0.75
        assert!((score - 0.75).abs() < f64::EPSILON);
    }

    #[test]
    fn test_conflicting_reduces_score() {
        let evidence = vec![
            make_evidence(EvidenceType::StrongIndicator),
            make_evidence(EvidenceType::Conflicting),
        ];
        let score = ConfidenceCalculator::calculate_score(&evidence);
        // (0.8 - 0.3) / 1.0 = 0.5
        assert!((score - 0.5).abs() < f64::EPSILON);
    }

    #[test]
    fn test_score_to_level() {
        assert_eq!(
            ConfidenceCalculator::score_to_level(0.9),
            ConfidenceLevel::High
        );
        assert_eq!(
            ConfidenceCalculator::score_to_level(0.7),
            ConfidenceLevel::Medium
        );
        assert_eq!(
            ConfidenceCalculator::score_to_level(0.4),
            ConfidenceLevel::Low
        );
        assert_eq!(
            ConfidenceCalculator::score_to_level(0.1),
            ConfidenceLevel::Inconclusive
        );
    }
}
