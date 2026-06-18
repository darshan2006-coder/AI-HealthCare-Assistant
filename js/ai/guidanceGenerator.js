export function generateExtraGuidance(
    symptoms,
    severity,
    temperature,
    riskLevel
) {

    let guidance = "\n📋 Additional Guidance:\n";

    if (riskLevel === "HIGH") {

        guidance +=
            "• Seek immediate medical attention\n";

        guidance +=
            "• Do not ignore worsening symptoms\n";

        guidance +=
            "• Consider visiting an emergency department\n";
    }

    else if (riskLevel === "MODERATE") {

        guidance +=
            "• Monitor symptoms closely\n";

        guidance +=
            "• Contact a healthcare provider if symptoms worsen\n";
    }

    else {

        guidance +=
            "• Continue rest and hydration\n";

        guidance +=
            "• Monitor symptoms daily\n";
    }

    if (temperature >= 103) {

        guidance +=
            "• High fever detected. Seek urgent care.\n";
    }

    return guidance;
}