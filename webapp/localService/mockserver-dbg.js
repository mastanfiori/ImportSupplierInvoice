/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/util/MockServer"
], function (MockServer) {
	"use strict";
	var oMockServer,
		_sAppModulePath = "fin/ap/invoice/upload/",
		_sJsonFilesModulePath = _sAppModulePath + "localService/mockdata";

	return {

		/**
		 * Initializes the mock server.
		 * You can configure the delay with the URL parameter "serverDelay".
		 * The local mock data in this folder is returned instead of the real data for testing.
		 * @public
		 */
		init: function () {
			var oUriParameters = jQuery.sap.getUriParameters(),
				sJsonFilesUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath),
				sManifestUrl = jQuery.sap.getModulePath(_sAppModulePath + "manifest", ".json"),
				sEntity = "InvoiceListSet",
				sErrorParam = oUriParameters.get("errorType"),
				iErrorCode = sErrorParam === "badRequest" ? 400 : 500,
				oManifest = jQuery.sap.syncGetJSON(sManifestUrl).data,
				oMainDataSource = oManifest["sap.app"].dataSources.mainService,
				sMetadataUrl = jQuery.sap.getModulePath(_sAppModulePath + oMainDataSource.settings.localUri.replace(".xml", ""), ".xml"),
				// ensure there is a trailing slash
				sMockServerUrl = /.*\/$/.test(oMainDataSource.uri) ? oMainDataSource.uri : oMainDataSource.uri + "/";

			oMockServer = new MockServer({
				rootUri: sMockServerUrl
			});

			// configure mock server with a delay of 1s
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: (oUriParameters.get("serverDelay") || 5)
			});

			// load local mock data
			oMockServer.simulate(sMetadataUrl, {
				sMockdataBaseUrl: sJsonFilesUrl,
				bGenerateMissingMockData: true
			});

			var aRequests = oMockServer.getRequests(),
				fnResponse = function (iErrCode, sMessage, aRequest) {
					aRequest.response = function (oXhr) {
						oXhr.respond(iErrCode, {
							"Content-Type": "text/plain;charset=utf-8"
						}, sMessage);
					};
				};

			// handling the metadata error test
			if (oUriParameters.get("metadataError")) {
				aRequests.forEach(function (aEntry) {
					if (aEntry.path.toString().indexOf("$metadata") > -1) {
						fnResponse(500, "metadata Error", aEntry);
					}
				});
			}

			// Handling request errors
			if (sErrorParam) {
				aRequests.forEach(function (aEntry) {
					if (aEntry.path.toString().indexOf(sEntity) > -1) {
						fnResponse(iErrorCode, sErrorParam, aEntry);
					}
				});
			}

			aRequests.push({

				method: "GET",

				path: new RegExp("GetCurrentUser"),

				response: function (oXhr) {
					jQuery.sap.log.debug("MockServer: incoming create request for url: " + oXhr.url);
					return oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8"
					}, JSON.stringify({
						d: {
							"GetCurrentUser": {
								"__metadata": {
									"type": "FAP_IMPORT_SUPPLIER_INVOICES.User"
								},
								"UserID": "TESTER"
							}
						}
					}));
				}

			});

			aRequests.push({

				method: "GET",

				path: new RegExp("Post/?((.*)?)?"),

				response: function (oXhr) {
					jQuery.sap.log.debug("MockServer: incoming create request for url: " + oXhr.url);
					if (oXhr.url.indexOf("PostEnabled") < 0) {
						return oXhr.respond(200, {
							"Content-Type": "application/json;charset=utf-8"
						}, JSON.stringify({
							d: {
								"Post": {
									"__metadata": {
										"type": "FAP_IMPORT_SUPPLIER_INVOICES.ActionResultPost"
									},
									"ActionOk": false,
									"Counter": 0,
									"SupplierInvoice": "",
									"FiscalYear": "",
									"SupplierInvoiceIsBlocked": false
								}
							}
						}));
					} else {
						return oXhr.respond(200, {
							"Content-Type": "application/json;charset=utf-8"
						}, JSON.stringify({
							d: {
								"PostEnabled": {
									"__metadata": {
										"type": "FAP_IMPORT_SUPPLIER_INVOICES.ActionResult"
									},
									"ActionOk": true
								}
							}
						}));
					}
				}

			});

			aRequests.push({

				method: "GET",

				path: new RegExp("Check/?((.*)?)?"),

				response: function (oXhr) {
					jQuery.sap.log.debug("MockServer: incoming create request for url: " + oXhr.url);
					return oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8"
					}, JSON.stringify({
						d: {
							"Check": {
								"__metadata": {
									"type": "FAP_IMPORT_SUPPLIER_INVOICES.ActionResult"
								},
								"ActionOk": true
							}
						}
					}));
				}
			});

			aRequests.push({

				method: "GET",

				path: new RegExp("Delete/?((.*)?)?"),

				response: function (oXhr) {
					jQuery.sap.log.debug("MockServer: incoming create request for url: " + oXhr.url);
					return oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8"
					}, JSON.stringify({
						d: {
							"Delete": {
								"__metadata": {
									"type": "FAP_IMPORT_SUPPLIER_INVOICES.ActionResult"
								},
								"ActionOk": true
							}
						}
					}));
				}
			});

			aRequests.push({

				method: "GET",

				path: new RegExp("ParkAsCompleted/?((.*)?)?"),

				response: function (oXhr) {
					jQuery.sap.log.debug("MockServer: incoming create request for url: " + oXhr.url);
					return oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8"
					}, JSON.stringify({
						d: {
							"ParkAsCompleted": {
								"__metadata": {
									"type": "FAP_IMPORT_SUPPLIER_INVOICES.ActionResult"
								},
								"ActionOk": true
							}
						}
					}));
				}
			});

			aRequests.push({

				method: "POST",

				path: new RegExp("GetLogHandle/?((.*)?)?"),

				response: function (oXhr) {
					jQuery.sap.log.debug("MockServer: incoming create request for url: " + oXhr.url);
					return oXhr.respond(200, {
						"Content-Type": "application/json;charset=utf-8"
					}, JSON.stringify({
						d: {
							"GetLogHandle": {
								"__metadata": {
									"type": "FAP_IMPORT_SUPPLIER_INVOICES.LogHandle"
								},
								"LogHandleID": "b1Y2Wnnz7kUZawZzzcbvsm",
								"LogNumber": "00000000000004613302"
							}
						}
					}));
				}
			});

			oMockServer.setRequests(aRequests);
			oMockServer.start();

			jQuery.sap.log.info("Running the app with mock data");
		},

		/**
		 * @public returns the mockserver of the app, should be used in integration tests
		 * @returns {sap.ui.core.util.MockServer} the mockserver instance
		 */
		getMockServer: function () {
			return oMockServer;
		}
	};

});