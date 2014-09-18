/**
 * @module spring-data-rest
 * @version <%= pkg.version %>
 *
 * Provider for the SpringDataRestAdapter which is the core of this module.
 */
angular.module("spring-data-rest").provider("SpringDataRestAdapter", function () {

    /**
     * Default configuration for spring data rest defaults
     */
    var config = {
        'linksKey': '_links',
        'linksHrefKey': 'href',
        'linksSelfLinkName': 'self',
        'embeddedKey': '_embedded',
        'embeddedNewKey': '_embeddedItems',
        'resourcesKey': '_resources',
        'resourcesFunction': undefined,
        'fetchFunction': undefined,
        'fetchAllKey': '_allLinks'
    };

    return {

        /**
         * Sets and gets the configuration object.
         *
         * @param {object} newConfig the new configuration to be set
         * @returns {object} the configuration object
         */
        config: function (newConfig) {
            // if the configuration object is 'undefined' then return the configuration object
            if (typeof newConfig !== 'undefined') {
                // throw an error if the given configuration is not an object
                if (!angular.isObject(newConfig)) {
                    throw new Error("The given configuration '" + newConfig + "' is not an object.");
                }

                // check if the given resource function is not undefined and is of type function
                if (newConfig.resourcesFunction != undefined && typeof(newConfig.resourcesFunction) != "function") {
                    throw new Error("The given resource function '" + newConfig.resourcesFunction + "' is not of type function.")
                }

                // check if the given fetch function is not undefined and is of type function
                if (newConfig.fetchFunction != undefined && typeof(newConfig.fetchFunction) != "function") {
                    throw new Error("The given fetch function '" + newConfig.fetchFunction + "' is not of type function.")
                }

                // override the default configuration properties with the given new configuration
                config = deepExtend(config, newConfig);
            }
            return config;
        },

        $get: ["$injector", function ($injector) {

            /**
             * Returns the Angular $resource method which is configured with the given parameters.
             *
             * @param {string} url the url at which the resource is available
             * @param {object} paramDefaults optional $resource method parameter defaults
             * @param {object} actions optional $resource method actions
             * @param {object} options additional $resource method options
             * @returns {*}
             */
            function resourcesFunction(url, paramDefaults, actions, options) {
                if (config.resourcesFunction == undefined) {
                    return $injector.get("$resource")(url, paramDefaults, actions, options);
                } else {
                    return config.resourcesFunction(url, paramDefaults, actions, options);
                }
            }

            /**
             * Fetches the given URL and adds the response to the given data object as a property
             * with the name of the given key.
             *
             * @param {string} url the url at which the resource is available
             * @param {string} key the key inside the data object where to store the returned response
             * @param {object} data the data object reference in which the response is stored
             * @param {array|string} fetchLinkNames the fetch link names to allow to process the fetched response
             * @param {boolean} recursive true if the fetched response should be processed recursively with the
             * adapter, false otherwise
             */
            function fetchFunction(url, key, data, fetchLinkNames, recursive) {
                if (config.fetchFunction == undefined) {
                    $injector.get("$http").get(url)
                        .success(function (responseData) {

                            // wrap the response again with the adapter if the recursive flag is set
                            data[key] = recursive ? new SpringDataRestAdapter(responseData, fetchLinkNames, true) : responseData;
                        })
                        .error(function (data, status) {
                            throw new Error("There was an error (" + status + ") retrieving the data from '" + url + "'");
                        });
                } else {
                    config.fetchFunction(url, key, data, fetchLinkNames, recursive);
                }
            }

            /**
             * The actual adapter method which processes the given JSON data object and adds
             * the wrapped resource property to all embedded elements where resources are available.
             *
             * @param {object} data the given JSON data
             * @param {object|string} fetchLinkNames the link names to be fetched automatically or the
             * 'fetchAllLinkNamesKey' key from the config object to fetch all links except the 'self' key.
             * @param {boolean} recursive true if the automatically fetched response should be processed recursively with the
             * adapter, false otherwise
             * @returns {object} the processed JSON data
             */
            var SpringDataRestAdapter = function (data, fetchLinkNames, recursive) {

                /**
                 * Wraps the Angular $resource method and adds the ability to retrieve the available resources. If no
                 * parameter is given it will return an array with the available resources in this object.
                 *
                 * @param {string|object} resourceObject the resource name to be retrieved or an object which holds the
                 * resource name and the parameters
                 * @param {object} paramDefaults optional $resource method parameter defaults
                 * @param {object} actions optional $resource method actions
                 * @param {object} options additional $resource method options
                 * @returns {object} the result of the $resource method or the available resources as a resource object array
                 *
                 * @see https://docs.angularjs.org/api/ngResource/service/$resource
                 */
                var resources = function (resourceObject, paramDefaults, actions, options) {
                    var resources = this[config.linksKey];
                    var parameters = paramDefaults;

                    // if a resource object is given process it
                    if (angular.isObject(resourceObject)) {
                        if (!resourceObject.name) {
                            throw new Error("The provided resource object must contain a name property.");
                        }

                        var resourceObjectParameters = resourceObject.parameters;

                        // if the default parameters and the resource object parameters are objects, then merge these two objects
                        // if not use the objects themselves as parameters
                        if (paramDefaults && angular.isObject(paramDefaults)) {
                            if (resourceObjectParameters && angular.isObject(resourceObjectParameters)) {
                                parameters = angular.extend(angular.copy(paramDefaults), angular.copy(resourceObjectParameters));
                            } else {
                                parameters = angular.copy(paramDefaults);
                            }
                        } else {
                            if (resourceObjectParameters && angular.isObject(resourceObjectParameters)) {
                                parameters = angular.copy(resourceObjectParameters);
                            }
                        }

                        // process the url and call the resources function with the given parameters
                        return resourcesFunction(getProcessedUrl(data, resourceObject.name), parameters, actions, options);
                    } else if (resourceObject in resources) {

                        // process the url and call the resources function with the given parameters
                        return resourcesFunction(getProcessedUrl(data, resourceObject), parameters, actions, options);
                    }

                    // return the available resources as resource object array if the resource object parameter is not set
                    var availableResources = [];
                    angular.forEach(resources, function (value, key) {

                        // if the URL is templated add the available template parameters to the returned object
                        if (value.templated) {
                            var templateParameters = extractTemplateParameters(value[config.linksHrefKey]);
                            availableResources.push({"name": key, "parameters": templateParameters});
                        } else {
                            availableResources.push({"name": key});
                        }
                    });
                    return availableResources;
                };

                // throw an exception if given data parameter is not of type object
                if (!angular.isObject(data) || data instanceof Array) {
                    throw new Error("Given data '" + data + "' is not of type object.");
                }

                // throw an exception if given fetch links parameter is not of type array or string
                if (fetchLinkNames != undefined && !(fetchLinkNames instanceof Array || typeof fetchLinkNames === "string")) {
                    throw new Error("Given fetch links '" + fetchLinkNames + "' is not of type array or string.");
                }

                var processedData = undefined;

                // only add the resource method to the object if the links key is present
                if (config.linksKey in data) {

                    // add Angular resources property to object
                    var resourcesObject = {};
                    resourcesObject[config.resourcesKey] = resources;
                    processedData = angular.extend(this, angular.copy(data), resourcesObject);

                    // if there are links to fetch, then process and fetch them
                    if (fetchLinkNames != undefined) {

                        // make a defensive copy if the processedData variable is undefined
                        if (!processedData) {
                            processedData = angular.copy(data);
                        }

                        // process all links
                        angular.forEach(data[config.linksKey], function (linkValue, linkName) {

                            // if the link name is not 'self' then process the link name
                            if (linkName != config.linksSelfLinkName) {

                                // check if:
                                // 1. the all link names key is given then fetch the link
                                // 2. the given key is equal
                                // 3. the given key is inside the array
                                if (fetchLinkNames == config.fetchAllKey ||
                                    (typeof fetchLinkNames === "string" && linkName == fetchLinkNames) ||
                                    (fetchLinkNames instanceof Array && fetchLinkNames.indexOf(linkName) >= 0)) {
                                    fetchFunction(getProcessedUrl(data, linkName), linkName,
                                        processedData, fetchLinkNames, recursive);
                                }
                            }
                        });
                    }
                }

                // only move the embedded values to a top level property if the embedded key is present
                if (config.embeddedKey in data) {

                    // make a defensive copy if the processedData variable is undefined
                    if (!processedData) {
                        processedData = angular.copy(data);
                    }

                    // process the embedded key and move it to an embedded value key
                    processedData = moveArray(processedData, config.embeddedKey, config.embeddedNewKey);

                    // recursively process all contained objects in the embedded value array
                    angular.forEach(processedData[config.embeddedNewKey], function (value, key) {
                        processedData[config.embeddedNewKey][key] = new SpringDataRestAdapter(value, fetchLinkNames, recursive);
                    });
                }

                // return the original data object if no processing is done
                return processedData ? processedData : data;

                /**
                 * Gets the processed URL of the given resource name form the given data object.
                 * @param {object} data the given data object
                 * @param {string} resourceName the resource name from which the URL is retrieved
                 * @returns {string} the processed url
                 */
                function getProcessedUrl(data, resourceName) {
                    // get the raw URL out of the resource name and check if it is valid
                    var rawUrl = checkUrl(data[config.linksKey][resourceName][config.linksHrefKey], resourceName,
                        config.linksHrefKey);

                    // extract the template parameters of the raw URL
                    return extractUrl(rawUrl, data[config.linksKey][resourceName].templated);
                }
            };
            return SpringDataRestAdapter;
        }]
    };

});
