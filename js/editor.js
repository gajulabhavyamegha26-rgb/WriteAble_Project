
const writingArea = document.getElementById("writingArea");
const checkButton = document.getElementById("checkButton");
const clearButton = document.getElementById("clearButton");

const wordCount = document.getElementById("wordCount");
const sentenceCount = document.getElementById("sentenceCount");
const statusMessage = document.getElementById("statusMessage");
const suggestions = document.getElementById("suggestions");

function updateCounts() {
    const text = writingArea.value.trim();

    const words = text === "" ? [] : text.split(/\s+/);

    const sentences = text === ""
        ? []
        : text.split(/[.!?]+/).filter(s => s.trim() !== "");

    wordCount.textContent = words.length;
    sentenceCount.textContent = sentences.length;
}

writingArea.addEventListener("input", updateCounts);

async function checkGrammar() {
    const text = writingArea.value.trim();

    if (text === "") {
        statusMessage.textContent = "Please enter some text first.";
        suggestions.innerHTML = "";
        return;
    }

    checkButton.disabled = true;
    statusMessage.textContent = "Checking your writing...";
    suggestions.innerHTML = "";

    try {
        const response = await fetch(
            "https://api.languagetool.org/v2/check",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    text: text,
                    language: "en-US"
                })
            }
        );

        if (!response.ok) {
            throw new Error("Grammar service unavailable.");
        }

        const data = await response.json();

        displaySuggestions(data.matches);

        if (data.matches.length === 0) {
            statusMessage.textContent =
                "Great! No grammar issues were found.";
        } else {
            statusMessage.textContent =
                data.matches.length + " suggestion(s) found.";
        }

    } catch (error) {
        statusMessage.textContent =
            "Unable to check writing. Please try again.";
        console.error(error);

    } finally {
        checkButton.disabled = false;
    }
}

function displaySuggestions(matches) {
    suggestions.innerHTML = "";

    if (matches.length === 0) {
        suggestions.textContent = "Your writing looks good!";
        return;
    }

    matches.forEach(match => {
        const card = document.createElement("div");
        card.className = "suggestion-card";

        const message = document.createElement("p");
        message.textContent = match.message;

        const original = document.createElement("p");
        original.textContent =
            "Original: " + match.context.text.substring(
                match.context.offset,
                match.context.offset + match.context.length
            );

        card.appendChild(message);
        card.appendChild(original);

        if (match.replacements.length > 0) {
            const button = document.createElement("button");
            button.className = "suggestion-button";
            button.textContent =
                "Replace with: " + match.replacements[0].value;

            button.addEventListener("click", () => {
                const start = match.offset;
                const end = start + match.length;

                writingArea.value =
                    writingArea.value.substring(0, start) +
                    match.replacements[0].value +
                    writingArea.value.substring(end);

                updateCounts();
                checkGrammar();
            });

            card.appendChild(button);
        }

        suggestions.appendChild(card);
    });
}

checkButton.addEventListener("click", checkGrammar);

clearButton.addEventListener("click", () => {
    writingArea.value = "";
    suggestions.innerHTML = "";
    statusMessage.textContent = "";
    updateCounts();
});

updateCounts();
