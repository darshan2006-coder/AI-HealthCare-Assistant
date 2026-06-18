export function showWarning(title, message) {

    document.getElementById(
        "warningTitle"
    ).textContent = title;

    document.getElementById(
        "warningText"
    ).textContent = message;

    document.getElementById(
        "warningModal"
    ).style.display = "block";
}

export function closeWarning() {

    document.getElementById(
        "warningModal"
    ).style.display = "none";
}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const btn =
            document.getElementById(
                "warningOkBtn"
            );

        if (btn) {
            btn.addEventListener(
                "click",
                closeWarning
            );
        }

    }
);