(function ($, window, document) {

    /** 
    * Class handling for the admin portion of ForceReloadMetaBoxAdmin
    *
    * @type    {Object}
    * 
    * @class
    * @global
    *
    * @since  1.0.0
    */
    var ForceReloadMetaBoxAdmin = {

        class_name         : "ForceReloadMetaBoxAdmin",
        
        default_options : {

            // Global variable from WordPress
            api_url : ajaxurl,

            elements : {

                force_refresh_meta_box             : "#force_refresh_specific_page_refresh",
                
                meta_box_refresh_type              : "#force-refresh-meta-box-refresh-type-selector",
                
                meta_box_refresh_options_container : "#force-refresh-meta-box-refresh-type-options-container",
                
                meta_box_refresh_button            : '#force-refresh-admin-page'

            }

        },

        /**
         * Our init method
         *
         * @return    {void}    
         */
         init : function () {
            var base = this;
            // Add options to the class
            this.options          = this.default_options;
            // Bind the form updates button
            // this.bindMetaBoxRefreshTypeUpdates(this.options.elements.meta_box_refresh_type);
            // $(window)
            // .load(function(){
            //     // Unhide the options
            //     $(base.options.elements.meta_box_refresh_options_container)
            //     .removeClass("hidden");
            // });
            $( this.options.elements.meta_box_refresh_button )
            .click(function(e){
                e.preventDefault();

                // Signal the refresh
                base.ajaxCall(
                    base.options.api_url,
                    "POST",
                    {
                        success: base.adminBarRefreshPageCallbackSuccess,

                        fail: base.adminBarRefreshPageCallbackFailure

                    },
                    {
                        action : "force_refresh_update_page_version",
                        page_id : force_refresh_local_js.post_id,
                        nonce : force_refresh_local_js.nonce

                    }
                    );
            });
        },

        /**
         * Method used as a callback for succesful requests originating from the WordPress Admin Ba
         *
         * @param     {object}    return_data    The return data
         *
         * @return    {void}                   
         */
         adminBarRefreshPageCallbackSuccess : function(return_data){
            // Declare base outside of block
            var base = this;
            // Wait until the spin logo is done to add the admin notice
            setTimeout(function(){
                // Add the admin notice
                base.addAdminNotice("You've successfully refreshed this page. All connected browsers will refresh within " + force_refresh_local_js.refresh_interval + " seconds.");
            }, 1500);
        },

        /**
         * Method used to add an Admin notice after a Force Refresh is requested.
         *
         * @param {string} message The message to display
         * @param {string} type    The type of message
         *
         * @return {void} 
         *
         * @version  1.0 Added in version 2.0
         */
         addAdminNotice: function(message, type){

            // By default, the message is a success
            type = type ? type : "success";

            // Get the template
            var source   = document.getElementById(force_refresh_local_js.handlebars_admin_notice_template_id).innerHTML;

            // Compile with Handlebars
            var template = Handlebars.compile(source);

            // Add the variables 
            var context = {
                message: message
            };

            // Get the HTML from the template and variables
            var html    = template(context);

            $("#force_refresh_specific_page_refresh")
            .before(html)
            .next();
        },

        /**
         * Method used as a callback for failed requests originating from the WordPress Admin Bar.
         *
         * @param     {object}    return_data    The return data
         *
         * @return    {void}                   
         */
         adminBarRefreshPageCallbackFailure : function(){

         },

        /**
         * Method for binding actions type of refresh on the meta box
         *
         * @param   {string} element The select element where the types of refreshes are made
         *
         * @return    {void}    
         */
         bindMetaBoxRefreshTypeUpdates : function(element){

            // Declare base outside of block
            var base = this;

            // Get the currently selected option
            var current_refresh_type = $(element).val();

            // Show the options for that type of refresh
            $(this.options.elements.meta_box_refresh_options_container)
            .children("div[data-refresh-type='" + current_refresh_type + "']")
            .addClass("selected");

            // Show the description for the curent refresh type
            $("#force-refresh-meta-box-refresh-type-descriptions")
            .children("li[data-refresh-type='" + current_refresh_type + "']")
            .addClass("selected");

            $(element)
            .change(function(e){

                // The new type of refresh
                var new_refresh_type = $(this).val();

                // Show the descriptions for the updated refresh type
                $(base.options.elements.meta_box_refresh_options_container)
                .children("div")
                .removeClass("selected")
                .end()
                .children("div[data-refresh-type='" + new_refresh_type + "']")
                .addClass("selected");

                // Show the descriptions for the updated refresh type
                $("#force-refresh-meta-box-refresh-type-descriptions")
                .children("li")
                .removeClass("selected")
                .end()
                .children("li[data-refresh-type='" + new_refresh_type + "']")
                .addClass("selected");


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

            var force_reload_admin_object = Object.create(ForceReloadMetaBoxAdmin);

            force_reload_admin_object.init();

        }

        catch(e){

            console.error("Error creating object (" + ForceReloadMetaBoxAdmin.class_name + ")! See error below for details.");

            console.error(e);

        }

    });


}(jQuery, window, document));