document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('setuForm');
    const msgBox = document.getElementById('msg');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Get Values
        const name = document.getElementById('name').value.trim();
        const mobile = document.getElementById('mobile').value.trim();
        const aadhaar = document.getElementById('aadhaar').value.trim();
        const service = document.getElementById('service').value;
        const address = document.getElementById('address').value.trim();

        // Basic Validation
        if (name === "" || mobile === "" || aadhaar === "" || service === "" || address === "") {
            showMessage("Please fill in all required fields.", "error");
            return;
        }

        // Mobile Validation (Simple 10 digit check)
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(mobile)) {
            showMessage("Please enter a valid 10-digit mobile number.", "error");
            return;
        }

        // Aadhaar Validation (Simple 12 digit check)
        const aadhaarRegex = /^[0-9]{12}$/;
        if (!aadhaarRegex.test(aadhaar)) {
            showMessage("Please enter a valid 12-digit Aadhaar number.", "error");
            return;
        }

        // Simulate API/Submission Delay
        const submitBtn = form.querySelector('.submit-btn');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        setTimeout(() => {
            // Success Action
            showMessage(`Application for ${service} Submitted Successfully! ✅`, "success");

            // Reset Form and Button
            form.reset();
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }, 1500);
    });

    function showMessage(message, type) {
        msgBox.textContent = message;
        msgBox.className = `message-box ${type}`;

        // Auto-hide error messages after a few seconds
        if (type === 'error') {
            setTimeout(() => {
                msgBox.textContent = '';
                msgBox.className = 'message-box';
            }, 5000);
        }
    }

    // Input Validation to allow only numbers for Mobile and Aadhaar
    const numberInputs = ['mobile', 'aadhaar'];
    numberInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', function (e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    });
});
