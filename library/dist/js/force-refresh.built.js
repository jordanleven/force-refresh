(function ($, window, document) {

    /** 
     * Class for handeling forced site reloads.
     *
     * @type    {Object}
     * 
     * @class
     * @global
     */
     var ForceReload = {

        class_name : "ForceReload",

        default_options : {

            // Global variable from WordPress
            api_url : force_refresh_js_object.ajax_url,

            elements : {

                force_refresh_admin_form : "#force-refresh-admin",

                force_refresh_admin_notice_container : "#alert-container"
            },
            timing : {

                update_site_version_interval_in_seconds : force_refresh_js_object.refresh_interval

            }


        },

        init : function () {

            // Add our options to the object
            this.options = this.default_options;

            // Update the current version of the site
            this.bindGetVersion();

        },

        /**
         * Method to bind actions to get the current site version.
         *
         * @return    {void}    
         */
         bindGetVersion : function(){
            // Localize this since we'll be putting it inside of setInterval
            var base = this;
            // Do the initial call
            base.getVersion();
            // Console
            base.debug( "Refreshing every " + base.options.timing.update_site_version_interval_in_seconds + " seconds...");
            // We need this to run on a regular interval
            setInterval(function(){
                // Check the site version
                base.getVersion();
            }, base.options.timing.update_site_version_interval_in_seconds * 1000);
        },

        /**
         * Method to make call to get the current site version
         *
         * @return    {void}    
         */
         getVersion : function(){

            // Make the call
            this.ajaxCall(
                this.options.api_url,
                "GET",
                { 
                    // The success callback
                    success : this.getVersionCallbackSuccess,
                    // The failure callback
                    fail    : this.getVersionCallbackSuccess
                },
                {
                    action : "force_refresh_get_version",
                    post_id: force_refresh_js_object.post_id
                }
                );

        },

        /**
         * Method used to handle successfull calls to the API to request the current site version.
         *
         * @param     {object}    return_object    The return object from the ajax call
         *
         * @return    {void}
         */
         getVersionCallbackSuccess : function(return_object){
            // Get the return data
            var return_data      = return_object.ajax_data.return_data,
            // Declare the site version we just found
            current_site_version = return_data.current_site_version,
            // Declare the page version we just found
            current_page_version = return_data.current_page_version,
            // Retrieve the current site version
            stored_site_version  = $( 'html' ).data( 'site-version' ),
            // Retrieve the current site version
            stored_page_version  = $( 'html' ).data( 'page-version' );
            // If there isn't a stored site version, we haven't attached it to the html
            if ( !stored_site_version ){
                this.debug("No stored site version. Storing new version (ver. " + current_site_version + ")");
                $("html")
                .data("site-version", current_site_version);
            }
            // If there isn't a stored page version, we haven't attached it to the html
            if ( !stored_page_version ){
                this.debug("No stored page version. Storing new version (ver. " + current_page_version + ")");
                $("html")
                .data("page-version", current_page_version);
            }
            // Otherwise, there is a stored site version we can compare
            else {
                // Now, compare the two site versions. If the current version is different than the stored version, we need to refresh the page
                if (current_site_version !== stored_site_version){
                    this.debug("New site version available. Refreshing...");
                    // Reload the page
                    location.reload();
                }
                // Now, compare the two page versions. If the current version is different than the stored version, we need to refresh the page
                else if (current_page_version !== stored_page_version){
                    this.debug("New page version available. Refreshing...");
                    // Reload the page
                    location.reload();
                }
                // Otherwise, we're up to date!
                else {
                    this.debug("Site up-to-date (ver. " + current_site_version + ")");
                }
            }
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
         * @param     {string | object}    message    The message or object to log
         *
         * @return    {void}
         *
         * @instance
         */
         debug: function(message){

            message = typeof(message) === "string" ? message : JSON.stringify(message);

            

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

        var force_reload_object = Object.create(ForceReload);

        force_reload_object.init();

    });


}(jQuery, window, document));