describe("the resources property", function () {

    beforeEach(beforeEachFunction);

    it("must contain the 'links key' key", function () {
        this.processedDataPromise.then(function (processedData) {
            expect(processedData[this.config.linksKey]).toBeDefined();
        });
    });

    it("must call the correct href url if a resource name is passed to the $resource method", function () {

        // define the resource name and the correct resource href url
        var resourceName = "self";
        var resourceHref = "http://localhost:8080/categories";

        // check if the underlying $resource method is called with the correct href url
        var expectedResult = {categoryId: '123'};
        this.httpBackend.whenGET(resourceHref).respond(200, expectedResult);
        this.httpBackend.expectGET(resourceHref);

        this.processedDataPromise.then(function (processedData) {
            var result = processedData[this.config.resourcesKey](resourceName).get(function () {
                expect(result.categoryId).toEqual(expectedResult.categoryId);
            });
            this.httpBackend.flush();
        });
    });

    it("must call the correct href url if a resource object is passed to the $resource method", function () {

        // define the resource object and the correct link href url
        var resourceObject = {
            'name': 'self'
        };
        var resourceHref = "http://localhost:8080/categories";

        // check if the underlying $resource method is called with the correct href url
        var expectedResult = {categoryId: '123'};
        this.httpBackend.whenGET(resourceHref).respond(200, expectedResult);
        this.httpBackend.expectGET(resourceHref);

        this.processedDataPromise.then(function (processedData) {
            var result = processedData[this.config.resourcesKey](resourceObject).get(function () {
                expect(result.categoryId).toEqual(expectedResult.categoryId);
            });
            this.httpBackend.flush();
        });
    });

    it("must call the correct href url with parameters if a resource object with parameters is passed to the $resource method", function () {

        // define the resource object and the correct link href url
        var resourceObject = {
            'name': 'self',
            'parameters': {
                'parameter1': '1',
                'parameter2': '2'
            }
        };
        var resourceHref = "http://localhost:8080/categories?parameter1=1&parameter2=2";

        // check if the underlying $resource method is called with the correct href url
        var expectedResult = {categoryId: '123'};
        this.httpBackend.whenGET(resourceHref).respond(200, expectedResult);
        this.httpBackend.expectGET(resourceHref);

        this.processedDataPromise.then(function (processedData) {
            var result = processedData[this.config.resourcesKey](resourceObject).get(function () {
                expect(result.categoryId).toEqual(expectedResult.categoryId);
            });
            this.httpBackend.flush();
        });
    });

    it("must call the correct href url without parameters if a resource object with empty parameters is passed to the $resource method", function () {

        // define the resource object and the correct link href url
        var resourceObject = {
            'name': 'self',
            'parameters': {
                'parameter1': "",
                'parameter2': ""
            }
        };
        var resourceHref = "http://localhost:8080/categories";

        // check if the underlying $resource method is called with the correct href url
        var expectedResult = {categoryId: '123'};
        this.httpBackend.whenGET(resourceHref).respond(200, expectedResult);
        this.httpBackend.expectGET(resourceHref);

        this.processedDataPromise.then(function (processedData) {
            var result = processedData[this.config.resourcesKey](resourceObject).get(function () {
                expect(result.categoryId).toEqual(expectedResult.categoryId);
            });
            this.httpBackend.flush();
        });
    });

    it("it must call the overridden resource function with the given resource name", function () {
        var url = undefined, paramDefaults = undefined, actions = undefined, options = undefined;
        var resourcesFunctionConfiguration = {
            'resourcesFunction': function (inUrl, inParamDefaults, inActions, inOptions) {
                url = inUrl;
                paramDefaults = inParamDefaults;
                actions = inActions;
                options = inOptions;
                return 'foo';
            }
        };

        // define the resource name and the correct resource href url
        var resourceName = "self";
        var resourceHref = "http://localhost:8080/categories";

        // set the new resource function with the given parameters
        springDataRestAdapterProvider.config(resourcesFunctionConfiguration);
        SpringDataRestAdapter.process(this.rawResponse).then(function (processedData) {
            // call the new resource method and expect the response and the call to the method
            var resourceResponse = processedData[this.config.resourcesKey](resourceName, 'paramDefaults', 'actions', 'options');
            expect(resourceResponse).toEqual('foo');
            expect(url).toEqual(resourceHref);
            expect(paramDefaults).toEqual('paramDefaults');
            expect(actions).toEqual('actions');
            expect(options).toEqual('options');
        });
    });

    it("it must call the overridden resource function with the given resource object", function () {
        var url = undefined, paramDefaults = undefined, actions = undefined, options = undefined;
        var resourcesFunctionConfiguration = {
            'resourcesFunction': function (inUrl, inParamDefaults, inActions, inOptions) {
                url = inUrl;
                paramDefaults = inParamDefaults;
                actions = inActions;
                options = inOptions;
                return 'foo';
            }
        };

        // define the resource name and the correct resource href url
        var resourceObject = {
            'name': 'self'
        };
        var resourceHref = "http://localhost:8080/categories";

        // set the new resource function with the given parameters
        springDataRestAdapterProvider.config(resourcesFunctionConfiguration);
        SpringDataRestAdapter.process(this.rawResponse).then(function (processedData) {
            // call the new resource method and expect the response and the call to the method
            var resourceResponse = processedData[this.config.resourcesKey](resourceObject, 'paramDefaults', 'actions', 'options');
            expect(resourceResponse).toEqual('foo');
            expect(url).toEqual(resourceHref);
            expect(paramDefaults).toEqual('paramDefaults');
            expect(actions).toEqual('actions');
            expect(options).toEqual('options');
        });
    });

    it("must throw an exception if a wrong resource object is given", function () {
        this.processedDataPromise.then(function (processedData) {
            // expect that the resources method is present
            expect(processedData[this.config.resourcesKey]).toBeDefined();

            // it must throw an exception if a wrong resource object is given
            expect(function () {
                expectResourceExecution(processedData, this.config.resourcesKey,
                    "expectedUrl", this.httpBackend, {'wrongPropertyName': 'value'});
            }).toThrow("The provided resource object must contain a name property.");
        });
    });

    it("must not use any parameters if the resource object is a string and no parameters are given", function () {
        this.processedDataPromise.then(function (processedData) {
            // expect that the resources method is present
            expect(processedData[this.config.resourcesKey]).toBeDefined();

            // the parameters must not be used in the resources method
            expectResourceExecution(processedData, this.config.resourcesKey,
                processedData[this.config.linksKey]["self"].href, this.httpBackend, "self")
        });
    });

    it("must use the given parameters if the resource object is a string", function () {
        this.processedDataPromise.then(function (processedData) {
            // expect that the resources method is present
            expect(processedData[this.config.resourcesKey]).toBeDefined();

            // the given parameters must be used in the resources method
            expectResourceExecution(processedData, this.config.resourcesKey,
                processedData[this.config.linksKey]["self"].href + "?parameterName=parameterValue", this.httpBackend, "self",
                {'parameterName': 'parameterValue'});
        });
    });

    it("must use the resource name if the correct resource object is given", function () {
        this.processedDataPromise.then(function (processedData) {
            // expect that the resources method is present
            expect(processedData[this.config.resourcesKey]).toBeDefined();

            // the given resource name must be used
            expectResourceExecution(processedData, this.config.resourcesKey,
                processedData[this.config.linksKey]["self"].href, this.httpBackend, {'name': 'self'})
        });
    });

    it("must use the correct resource object name and the given parameters", function () {
        this.processedDataPromise.then(function (processedData) {
            // expect that the resources method is present
            expect(processedData[this.config.resourcesKey]).toBeDefined();

            // the given parameters must be used in the resources method
            expectResourceExecution(processedData, this.config.resourcesKey,
                processedData[this.config.linksKey]["self"].href + "?parameterName=parameterValue",
                this.httpBackend, {'name': 'self'}, {'parameterName': 'parameterValue'})
        });
    });

    it("must use the correct resource object name and parameters", function () {
        this.processedDataPromise.then(function (processedData) {
            // expect that the resources method is present
            expect(processedData[this.config.resourcesKey]).toBeDefined();

            // the given parameters must be used in the resources method
            expectResourceExecution(processedData, this.config.resourcesKey,
                processedData[this.config.linksKey]["self"].href + "?parameterName=parameterValue",
                this.httpBackend, {'name': 'self', 'parameters': {'parameterName': 'parameterValue'}})
        });
    });

    it("must use the correct resource object name and merge the resource object parameters with the given parameters", function () {
        this.processedDataPromise.then(function (processedData) {
            // expect that the resources method is present
            expect(processedData[this.config.resourcesKey]).toBeDefined();

            // the given parameters must be used in the resources method
            expectResourceExecution(processedData, this.config.resourcesKey,
                processedData[this.config.linksKey]["self"].href + "?objectParameterName=objectParameterValue&parameterName=parameterValue",
                this.httpBackend, {'name': 'self', 'parameters': {'objectParameterName': 'objectParameterValue'}},
                {'parameterName': 'parameterValue'})
        });
    });

    it("must return the resources of the object", function () {
        SpringDataRestAdapter.process(this.rawResponse).then(function (processedData) {
            // expect that the resources method is present
            expect(processedData[this.config.resourcesKey]).toBeDefined();

            // expect that the resource method returns the available resources on the object
            expect(processedData[this.config.resourcesKey]()).toEqual([
                    {
                        name: 'self',
                        parameters: {
                            page: "",
                            size: "",
                            sort: ""
                        }
                    },
                    {
                        name: 'testLink'
                    }
                ]
            );
        });
    });

    it("must return the resources of the object with empty parameters if the templated property is false", function () {
        this.rawResponse = mockWithoutTemplateParametersData();
        SpringDataRestAdapter.process(this.rawResponse).then(function (processedData) {
            // expect that the resources method is present
            expect(processedData[this.config.resourcesKey]).toBeDefined();

            // expect that the resource method returns the available resources on the object
            expect(processedData[this.config.resourcesKey]()).toEqual([
                    {
                        name: 'users'
                    },
                    {
                        name: 'categories'
                    }
                ]
            );
        });
    });

    it("must return the resources of the index response", function () {
        this.rawResponse = mockIndexData();
        SpringDataRestAdapter.process(this.rawResponse).then(function (processedData) {
            // expect that the resources method is present
            expect(processedData[this.config.resourcesKey]).toBeDefined();

            // expect that the resource method returns the available resources on the index response
            expect(processedData[this.config.resourcesKey]()).toEqual([
                    {
                        name: 'users',
                        parameters: {
                            page: "",
                            size: "",
                            sort: ""
                        }
                    },
                    {
                        name: 'categories',
                        parameters: {
                            page: "",
                            size: "",
                            sort: ""
                        }
                    },
                    {
                        name: 'accounts',
                        parameters: {
                            page: "",
                            size: "",
                            sort: ""
                        }
                    }
                ]
            );
        });
    });

    it("must throw an exception if the href property is empty", function () {
        this.rawResponse = mockWithEmptyHrefPropertyData();
        SpringDataRestAdapter.process(this.rawResponse).then(function (processedData) {
            // expect that the resources method is present
            expect(processedData[this.config.resourcesKey]).toBeDefined();

            // expect that the resource method with the specified resource name throws an exception
            expect(function () {
                processedData[this.config.resourcesKey]("self")
            }).toThrow("The provided resource name 'self' has no valid URL in the 'href' property.");

            // expect that the resource method with the specified resource object throws an exception
            expect(function () {
                processedData[this.config.resourcesKey]({'name': 'self'})
            }).toThrow("The provided resource name 'self' has no valid URL in the 'href' property.");
        });
    });

    it("must throw an exception if the href property is not present", function () {
        this.rawResponse = mockWithoutHrefPropertyData();
        this.response = SpringDataRestAdapter.process(this.rawResponse).then(function (processedData) {
            // expect that the resources method is present
            expect(processedData[this.config.resourcesKey]).toBeDefined();

            // expect that the resource method with the specified resource name throws an exception
            expect(function () {
                processedData[this.config.resourcesKey]("self")
            }).toThrow("The provided resource name 'self' has no valid URL in the 'href' property.");

            // expect that the resource method with the specified resource object throws an exception
            expect(function () {
                processedData[this.config.resourcesKey]({'name': 'self'})
            }).toThrow("The provided resource name 'self' has no valid URL in the 'href' property.");
        });
    });

});

