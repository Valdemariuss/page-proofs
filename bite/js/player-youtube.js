(function() {

    $(function() {  

        // Close the video overlay and stop video
        $("#videoOverlay").on("click", function(event) {
            var iframe = $('iframe')[0];
            if ( iframe ) {
                var iframeSrc = iframe.src;
                iframe.src = iframeSrc;
            }
            $(this).addClass('hidden');
        });
    
     });
})();
