(function ($, window, document) {

    /** 
    * Class handling for the admin portion of ForceReloadAdmin
    *
    * @type    {Object}
    * 
    * @class
    * @global
    *
    * @since  1.0.0
    */
    var ForceReloadAdmin = {

        class_name         : "ForceReloadAdmin",
        
        default_options : {

            // Global variable from WordPress
            api_url : ajaxurl,

            elements : {

                force_refresh_admin_form : "#force-refresh-admin",

                force_refresh_admin_notice_container : "#alert-container"
            }

        },

        /**
        * Our init method
        *
        * @return    {void}    
        */
        init : function () {

            // Add options to the class
            this.options          = this.default_options;

            // Bind the form updates button
            this.bindFormUpdates(this.options.elements.force_refresh_admin_form);

        },

        /**
         * Method for binding actions to the admin form for Force Refresh.
         *
         * @param   {string} element The form element
         *
         * @return    {void}    
         */
         bindFormUpdates : function(element){

            // Declare base outside of block
            var base = this;

            $(element)
            .submit(function(e){

                // Remove any existing alerts
                $(base.options.elements.force_refresh_admin_notice_container)
                .empty();

                // We're handling the action ourselves, so prevent the page from refreshing
                e.preventDefault();

                base.ajaxCall(
                    base.options.api_url,
                    "POST",
                    {
                        success: base.refreshSiteCallbackSuccess,

                        fail: base.refreshSiteCallbackFailure

                    },
                    {
                        action : "force_refresh_update_site_version",

                        nonce : force_refresh_local_js.nonce

                    }
                    );

            });

        },

        /**
        * Method used as a callback for succesful requests
        *
        * @param     {object}    return_data    The return data
        *
        * @return    {void}                   
        */
        refreshSiteCallbackSuccess: function(return_data){

            // Declare base outside of block
            var base = this;

            // Do the spin
            this.spinLogo();

            // Wait unti the logo is done spinning to alert the user
            setTimeout(function(){

                // Get the ajax data
                var ajax_data = return_data.ajax_data;

                // Add the notice
                base.addNotice(return_data.ajax_data.status_text);

            }, 1000);


        },

        /**
        * Method used as a callback for failed requests
        *
        * @param     {object}    return_data    The return data
        *
        * @return    {void}                   
        */
        refreshSiteCallbackFailure : function(return_data){

            // Get the ajax data
            var ajax_data = return_data.ajax_data;

            // Add the notice
            this.addNotice(return_data.ajax_data.status_text, "error");

        },

        /**
        * Method to add alerts to the admin screen
        *
        * @param    {string}    alert_text    The text to alert the user
        * @param    {string}    alert_type    The type of alert
        *
        * @return {void}
        */
        addNotice : function(notice_text, notice_type){

            // Declaure our default
            notice_type = notice_type ? notice_type : "success";

            // Create the notice
            var notice_html = "<div class=\"notice notice-invisible notice-hidden notice-" + notice_type + " is-dismissible\"><p><strong>" + notice_text + "</strong></p></div>";

            // We need to get the height for this element. To do this, append it to the HTML and get the height (before removing it, of course)
            $("body")
            .append(notice_html)
            .find(".notice")
            .removeClass("notice-invisible")
            .addClass("notice-force-refresh-tmp");

            // Get the height (it can change depending on the return message)
            var alert_height = $("body").find(".notice-force-refresh-tmp").outerHeight();

            // Remove the alert
            $("body")
            .find(".notice-force-refresh-tmp")
            .remove();

            // Add the real alert
            $(this.options.elements.force_refresh_admin_notice_container)
            .empty()
            .html(notice_html)
            .find(".notice")
            .css("height", 0)
            .removeClass("notice-hidden")
            .animate({
                "height": alert_height + "px"
            }, 500, function(){

                // Fade in after height animation completes
                $(this)
                .removeClass("notice-invisible")
                // Set the heigh to auto
                .css("height", "auto");

            });

        },

        /**
        * Method used for animating the logo.
        *
        * @return    {void}   
        */
        spinLogo : function(){

            // Add the class to make it spin
            $(".site-refresh-inner .logo")
            .addClass("logo-spin");

            // After the animation is done, remove the class
            setTimeout(function(){

                $(".site-refresh-inner .logo.logo-spin")
                .removeClass("logo-spin");

            }, 1000);

        },

        /**
        * Method used to submit AJAX calls and execute promises
        *
        * @param     {string}    action                  The action for the call to execute
        * @param     {object}    callback_object         An object of done and always callbacks
        * @param     {object}    data_object             An object of data to send to the API
        * @param     {object}    additional_arguments    An object of data to send to the done callback
        *                                              after the call is complete
        * @return    {void}
        *
        * 
        * @instance
        */
        ajaxCall : function(api_url, method, callback_object, data_object, additional_arguments){

            // If data_object is null, than create an empty object
            data_object = data_object ? data_object : {};

            // Make additional arguments an object if null
            additional_arguments = additional_arguments ? additional_arguments : {};

            // Add data object to additional arguments
            additional_arguments.data_object = data_object;

            this.debug("Submitting AJAX call...");

            $.ajax({
                type     : method,
                url      : api_url,
                context  : this,
                data     : data_object,
                dataType : 'JSON'
            })

            // Done promise
            .done(function(ajax_data) {

                this.debug("AJAX call finished.");

            })

            // Success promise
            .success(function(ajax_data){

                // Check to make sure the call was successful
                if (ajax_data.success){

                    // If there's a specified callback
                    if (callback_object.success){

                        // Execute the callback and include the object context, data, and arguments
                        callback_object.success.call(this, {"ajax_data" : ajax_data, "additional_arguments" : additional_arguments});

                    }
                }

                else {

                    this.error(ajax_data);
                }

            })

            // Always promise
            .always(function(){

                if (callback_object.always){

                    callback_object.always.call(this);

                }

            })

            // Fail promise
            .fail(function(ajax_data){

                // If there's an error
                this.error("AJAX error. Error below:");

                // Log the error
                this.error(ajax_data);

                // If there's a specified callback for failing
                if (callback_object.fail){

                    // Execute the callback and include the object context, data, and arguments
                    callback_object.fail.call(this, {"ajax_data" : ajax_data.responseJSON, "additional_arguments" : additional_arguments});

                }
            })
            ;
        },

        /**
        * Method used to debug info to console
        *
        * @param     {string | object }   message    The message or object to log
        *
        * @return    {void}
        */
        debug: function(message){

            message = typeof(message) === "string" ? message : JSON.stringify(message);

            console.debug(this.class_name + " - " + message);

        },

        /**
         * Method used to log errors to console
         *
         * @param     {string | object}    message    The message or object to log
         *
         * @return    {void}
         *
         * @instance
         */
         error: function(message){

            message = typeof(message) === "string" ? message : JSON.stringify(message);

            console.error(this.class_name + " - " + message);
        },

        /**
         * Method used to log warnings to console
         *
         * @param     {string | object}    message    The message or object to log
         *
         * @return    {void}
         *
         * @instance
         */
         warn: function(message){

            message = typeof(message) === "string" ? message : JSON.stringify(message);

            console.warn(this.class_name + " - " + message);
        }

    };

    $(function(){

        try {

            var force_reload_admin_object = Object.create(ForceReloadAdmin);

            force_reload_admin_object.init();

        }

        catch(e){

            console.error("Error creating object (" + ForceReloadAdmin.class_name + ")! See error below for details.");

            console.error(e);

        }

    });


}(jQuery, window, document));