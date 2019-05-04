(function() {

    // Add/remove number from 'Number' section in popup footer
    function toggleSelectedNumber(number) {
        var selectedNumbersElement = $("#selectedNumbers");
        var numberElement = selectedNumbersElement
            .children("div.chosen-number")
            .filter(":contains("+number+")");

        if (numberElement.length) {
            // number should be removed
            numberElement.eq(0).remove();
        } else {
            // number should be added
            var htmlString = createNumberElement(number);
            var html = $.parseHTML(htmlString);
            selectedNumbersElement.append(html);
        }
    }

    // DOM element of selected number to be added into popup footer
    function createNumberElement(number) {
        return `
            <div class="chosen-number">
                <span class="chosen-number__number">${number}</span>
                <span class="chosen-number__icon">
                    <img src="images/icons/icon-close-circle.svg" width="20" alt="delete" title="delete">
                </span>
            </div>`;
    }

    // Hide modal on background click
    function hideModal(modal) {
        $(".modal-backdrop").on("click", function() {
            modal.modal('hide');
        });
    }

    $(function() {

        // Toggle number selection from popup right body section
        $(".numbers-item").on("click", function(event) {
            var number = $(this).text();
            $(this).toggleClass("active");
            toggleSelectedNumber(number);
        });

        // Handle click on remove icon of selected number in popup footer
        $("#selectedNumbers").on("click", ".chosen-number .chosen-number__icon", function(event) {
            $(this).addClass("chosen-number__icon--clicked");
            var selectedNumberElement = $(this).parent();
            var numberToRemove = selectedNumberElement
                .children('span.chosen-number__number').text();
            selectedNumberElement.remove();
            var currentNumberSelector = $(".numbers-item").filter(":contains("+numberToRemove+")").eq(0);
            currentNumberSelector.toggleClass("active");
        });

        $("#selectedNumbers").on("mousedown", ".chosen-number .chosen-number__icon", function(event) {
            $(this).toggleClass("chosen-number__icon--clicked");
        });

        // Initialize phones Swiper after the modal is shown
        $("#tariffPlanPopup").on("shown.bs.modal", function() {

            hideModal ($(this)); // watching for background click to hide modal

            var swiper = new Swiper(".swiper-container", {
                navigation: {
                  nextEl: ".swiper-button-next",
                  prevEl: ".swiper-button-prev",
                },
            });
        });

        // Loader animation on button click
        $(".btn-authorize").on("click", function(e) {
            e.preventDefault();
            var button = $(this);
            var buttonText = button.text();
            button.html("");
            button.addClass("loading");
            setTimeout(function(){
                button.html(buttonText);
                button.removeClass("loading");
            }, 5000);
            return false;
        });
     });
})();

