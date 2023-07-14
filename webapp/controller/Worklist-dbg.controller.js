/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"fin/ap/invoice/upload/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"fin/ap/invoice/upload/model/formatter",
	"fin/ap/invoice/upload/util/Constants",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Item",
	"sap/ui/model/Sorter",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/Dialog",
	"sap/ui/core/IconPool",
	"fin/ap/invoice/upload/util/EditDialog"
], function (BaseController, JSONModel, History, formatter, Constants, Filter, FilterOperator, Item, Sorter, MessageToast,
	MessageBox, Dialog, IconPool, EditDialog) {
	"use strict";

	return BaseController.extend("fin.ap.invoice.upload.controller.Worklist", {

		formatter: formatter,
		_oPage: undefined,
		_oDownloadDialog: undefined,

		_oWorklistSmartTable: undefined,
		_oWorklistTable: undefined,

		_iActionTotalNum: 0,
		_iActionNotFinished: 0,
		_iActionSuccessNum: 0,
		_iDuplicateCheckNotFinished: 0,

		_aEntriesNotDuplicate: [],
		_aSelectedItems: [],

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the upload controller is instantiated.
		 * @public
		 */
		onInit: function () {
			BaseController.prototype.onInit.call(this);
			//var oViewModel,iOriginalBusyDelay;
			this._oPage = this.byId("fin.ap.invoice.upload.UploadPage");
			this._oWorklistSmartTable = this.byId(Constants.UploadPageWorklistSmartTableID);
			this._oWorklistTable = this.byId(Constants.UploadPageWorklistTableID);

			// this.oDataModel = this.getOwnerComponent().getModel();

			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			this._oWorklistSmartTable.addStyleClass("sapUiMediumMarginBeginEnd");

			var sNoDataText = this.getResourceBundle().getText("NoDataText");
			this._oWorklistSmartTable.setNoData(sNoDataText);

			// this._oPage.setBusyIndicatorDelay(1);
			this.oRouter.attachRouteMatched(this.onRouteMatched, this);
			this.initUploaderPressEvent();
			this.initAppState();

		},

		initAppState: function () {

			var oParseNavigationPromise = this.oNavigationHandler.parseNavigation();
			var that = this;
			oParseNavigationPromise.done(function (oAppData, oURLParameters, sNavType) {
				if (sNavType !== sap.ui.generic.app.navigation.service.NavType.initial) {
					if (oAppData.customData) {
						if (oAppData.customData.RootKey && oAppData.customData.Key) {
							that.singleCheck(oAppData.customData);
						}
					}
				}
			});

			oParseNavigationPromise.fail(function (oError) {
				that._handleError(oError);
			});
		},

		initUploaderPressEvent: function () {
			var oFileUploader = this.byId(Constants.FileUploaderID);
			// this._oUploader = oFileUploader;
			var orgFnc = oFileUploader.onmousedown;
			var that = this;
			oFileUploader.onmousedown = function (oEvent) {
				var aItems = that._oWorklistTable.getItems();
				if (aItems.length === 0) {
					orgFnc.call(this, oEvent);
				} else {
					MessageBox.error(that.getResourceBundle().getText("ClearFirst"));
				}
			};
		},

		/**
		 * Handle control rendering event.
		 */
		onBeforeRendering: function () {
			var sCozyClass = "sapUiSizeCozy",
				sCompactClass = "sapUiSizeCompact",
				sCondenseClass = "sapUiSizeCondensed";
			if (this._oWorklistTable) {
				if (jQuery(document.body).hasClass(sCompactClass) || this.getOwnerComponent().getContentDensityClass() === sCompactClass) {
					this._oWorklistTable.addStyleClass(sCondenseClass);
				} else if (jQuery(document.body).hasClass(sCozyClass) || this.getOwnerComponent().getContentDensityClass() === sCozyClass) {
					this._oWorklistTable.addStyleClass(sCozyClass);
				}
			}
		},

		onRouteMatched: function (oEvent) {
			var sPatternName = oEvent.getParameter("name");
			if (sPatternName === "worklist") {
				//Open Directly
			} else if (sPatternName === "worklist-external") {
				//Jump from other application to upload page.
			}

			this._getPostEnabled();
			this._featureToggleForEdit();

		},

		onRowSelectionChange: function (oEvent) {
			//Triggered when row selection changed.
			var aSelectedItems = [];
			var oUIModel = this.getView().getModel("ui");
			aSelectedItems = this._oWorklistTable.getSelectedItems();
			if (aSelectedItems.length > 0) {
				oUIModel.setProperty("/postBtnEnabled", true);
			} else {
				oUIModel.setProperty("/postBtnEnabled", false);
			}

			if (aSelectedItems.length === 1) {
				var oListItem = aSelectedItems[0];
				// var oListItem = oEvent.getParameter("listItem");
				var oObject = oListItem.getBindingContext().getObject();
				this.RootKey = oObject.RootKey;
				this.Key = oObject.Key;
			} else {
				this.RootKey = undefined;
				this.Key = undefined;
			}
		},

		onTableDataReceived: function (oEvent) {
			this._oWorklistTable.fireSelectionChange();
			if (oEvent.getParameters().getSource().getLength() === 0) {
				this.byId(Constants.FileUploaderID).setValue();
			}

		},

		onBeforeRebindViewTable: function (oEvent) {
			var oBindingParams = oEvent.getParameter("bindingParams");
			if (oBindingParams) {
				var oSorterTemp;
				oSorterTemp = this._createSorter();
				oBindingParams.sorter = oSorterTemp;
			}
		},

		_createSorter: function () {

			var oReturnSorter;
			var oSorterStatus = new Sorter("CheckStatus", false, false);
			var oSorterCompanyCode = new Sorter("CompanyCode", false, false);
			var oSorterInvoicingParty = new Sorter("InvoicingParty", false, false);
			var oSorterDocumentDate = new Sorter("DocumentDate", false, false);
			var oSorterPostingDate = new Sorter("PostingDate", false, false);
			var oSorterDocumentCurrency = new Sorter("Currency", false, false);
			var oSorterInvoiceGrossAmount = new Sorter("Amount", false, false);

			oReturnSorter = [oSorterStatus, oSorterCompanyCode, oSorterInvoicingParty, oSorterDocumentDate, oSorterPostingDate,
				oSorterDocumentCurrency, oSorterInvoiceGrossAmount
			];
			return oReturnSorter;
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will navigate to the shell home
		 * @public
		 */
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
				history.go(-1);
			} else {
				// oCrossAppNavigator.toExternal({
				// 	target: {
				// 		shellHash: "#Shell-home"
				// 	}
				// });
			}
		},

		/* =========================================================== */
		/* Methods of Uploading File                                   */
		/* =========================================================== */

		onFileChange: function () {
			//This event fired when user select a file to upload.
			this._addTokenToUploader();
			var oFileUploader = this.byId(Constants.FileUploaderID);
			var aItems = this._oWorklistTable.getItems();
			if (oFileUploader.getValue() && aItems.length === 0) {
				oFileUploader.upload();
				this._oPage.setBusy(true);
			} else if (aItems.length > 0) {
				MessageBox.error(this.getResourceBundle().getText("ClearFirst"));
			}
		},

		handleUploadCompleted: function (oEvent) {
			var that = this;
			var oResponse = oEvent.getParameters("response");
			var sResponse = oResponse.responseRaw;
			if (oResponse.status === 201) {
				//Successfully Uploaded
				var oUploadedInfo = this._parseUploadedInfo(sResponse);
				if (oUploadedInfo.iTotalUpload !== "1") {
					MessageToast.show(this.getResourceBundle().getText("UploadSuccess", oUploadedInfo.iTotalUpload));
				} else {
					MessageToast.show(this.getResourceBundle().getText("SingleUploadSuccess", oUploadedInfo.iTotalUpload));
				}
				this._oWorklistSmartTable.rebindTable();
			} else {
				//Error
				//Have some content error with the uploaded file
				if (sResponse === "CSRF token validation failed") {
					//Token is not validate. Have checked in different language.
					this._oPage.setBusy(false);
					MessageBox.error(this.getResourceBundle().getText("LoginTimeOutMsg"), {
						onClose: function () {
							that._oWorklistSmartTable.rebindTable();
						}
					});
					return;
				}

				var aMessages = this._parseUploadMessage(sResponse);
				if (this.warningMessage === false) {
					var sHTML = "";
					if (aMessages.length > 0) {
						var sErrorHead = this.getResourceBundle().getText("UploadFailedHeader");
						sHTML = "<p>" + sErrorHead + "</p>" +
							"<ul>";
						for (var i = 0; i < aMessages.length; i++) {
							sHTML = sHTML + "<li>" + aMessages[i].ErrorMessage + "</li>";
						}
						var sHelpText = this.getResourceBundle().getText("UploadFailedHelp");
						var sHelp = this.getResourceBundle().getText("SAPHelp");
						sHTML = sHTML + "</ul>" + "<p>" + sHelpText +
							" <a href=\"//help.sap.com\">" + sHelp + "</a>.</p>";
						// "<p>For More Information check <a href=\"//www.sap.com\">help</a> </p>";

						MessageBox.error(this.getResourceBundle().getText("UploadFailed"), {
							onClose: function () {
								that._oWorklistSmartTable.rebindTable();
							},
							details: sHTML
						});
					} else {
						MessageBox.error(this.getResourceBundle().getText("ErrorOccur"));
					}
				} else {
					if (aMessages.length > 0) {
						var sWarningText;
						for (var j = 0; j < aMessages.length; j++) {
							sWarningText = sWarningText + aMessages[j].ErrorMessage + "/n";
						}
						MessageBox.warning(sWarningText);

					}
				}
			}

			this._oPage.setBusy(false);

		},

		_addTokenToUploader: function () {
			//Add header parameters to file uploader.
			var oDataModel = this.getOwnerComponent().getModel();
			var sTokenForUpload = oDataModel.getSecurityToken();
			var oFileUploader = this.byId(Constants.FileUploaderID);
			var oHeaderParameter = new sap.ui.unified.FileUploaderParameter({
				name: "X-CSRF-Token",
				value: sTokenForUpload
			});
			//Header parameter need to be removed then added.
			oFileUploader.removeAllHeaderParameters();
			oFileUploader.addHeaderParameter(oHeaderParameter);
			var sUploadURL = oDataModel.sServiceUrl + Constants.UploadEntitySet;
			oFileUploader.setUploadUrl(sUploadURL);
		},

		_parseUploadedInfo: function (sResponse) {
			var sTempStr, iIndexS, iIndexE;
			var oParseResults = {};
			iIndexS = sResponse.indexOf("<d:NumberOfDocumentsUploaded>");
			iIndexE = sResponse.indexOf("</d:NumberOfDocumentsUploaded>");
			if (iIndexS !== -1 && iIndexE !== -1) {
				sTempStr = sResponse.slice(iIndexS + 29, iIndexE);
				oParseResults.iTotalUpload = sTempStr;
			}
			return oParseResults;
		},

		_parseUploadMessage: function (sResponse) {
			//Analyze messages in the upload response. 
			var oXML;
			var aMessagesList = [];
			try {
				//Parse XML to an JSON model.
				oXML = jQuery.parseXML(sResponse);
			} catch (err) {
				oXML = null;
			}
			if (oXML) {
				var oErrorDetails = oXML.getElementsByTagName("errordetails");
				if (oErrorDetails && (oErrorDetails.length > 0) && oErrorDetails[0].childNodes && oErrorDetails[0].childNodes.length > 0) {
					var aMessages = oErrorDetails[0].childNodes;
					var iLength = aMessages.length;
					var sCode, sMsg, sSeverity;
					if (iLength > 1) {
						this.warningMessage = true;
						for (var i = 0; i < iLength; i++) {
							sCode = aMessages[i].getElementsByTagName("code")[0].textContent;
							sMsg = aMessages[i].getElementsByTagName("message")[0].textContent;
							sSeverity = aMessages[i].getElementsByTagName("severity")[0].textContent;
							if (sCode !== "/IWBEP/CX_MGW_BUSI_EXCEPTION" && (sSeverity === "error" || sSeverity === "warning")) {
								if (sSeverity === "error") {
									this.warningMessage = false;
								}
								var oDetails = {
									ErrorMessage: sMsg,
									MessageType: sSeverity
								};
								aMessagesList.push(oDetails);
							}
						}
					} else if (iLength === 1) {
						sCode = aMessages[0].getElementsByTagName("code")[0].textContent;
						sMsg = aMessages[0].getElementsByTagName("message")[0].textContent;
						sSeverity = aMessages[0].getElementsByTagName("severity")[0].textContent;
						if (sSeverity === "error") {
							this.warningMessage = false;
						}
						if (sCode !== "/IWBEP/CX_MGW_BUSI_EXCEPTION") {
							var oDetail = {
								ErrorMessage: sMsg,
								MessageType: sSeverity
							};
							aMessagesList.push(oDetail);
						}
					}
				} else {
					var oError = oXML.getElementsByTagName("message");
					if (oError && oError.length > 0) {
						this.warningMessage = false;
						sMsg = oError[0].textContent;
						var oCommonMessage = {
							ErrorMessage: sMsg,
							MessageType: "error"
						};
						aMessagesList.push(oCommonMessage);
					}
				}
			}
			return aMessagesList;
		},

		/* =========================================================== */
		/* Methods of Downloading template                              */
		/* =========================================================== */

		handleDownloadPress: function () {
			// supported formant Excel only now
			// CSVC = CSV ( delimiter comma ) CSVS = CSV ( delimiter semicolon ) will be considered in future

			//var aTemplateType = ["XLSX", "CSVC", "CSVS"];
			//var oRadioBtnGroup = this.byId(Constants.DownloadRadioButtonGroupID);
			//var iSelectedIndex = oRadioBtnGroup.getSelectedIndex();
			//var sFileType = aTemplateType[iSelectedIndex];
			var sFileType = "XLSX";
			var oLanguageDropdown = this.byId(Constants.DownloadLanguageDropdownID);
			var sLanguage = oLanguageDropdown.getSelectedKey();
			if (!sLanguage) {
				sLanguage = sap.ui.getCore().getConfiguration().getLocale().getLanguage();
			}
			var oDataModel = this.getOwnerComponent().getModel();
			var sServiceURL = oDataModel.sServiceUrl;
			var sName = this.getResourceBundle().getText('Supplier_Invoice') + '_' + sLanguage;
			var sDownloadURL = sServiceURL + "/FilesContentForDownload(IsTemplate=1,Mimetype='" + sFileType +
				"')/$value?$filter=Language eq '" +
				sLanguage + "' and FileName eq '" + sName + ".";
			// CSVC and CSVS will be saved as CSV file
			// if (iSelectedIndex > 0) {
			// 	sFileType = sFileType.toLocaleLowerCase().slice(0, 3);
			// }
			sDownloadURL = sDownloadURL + sFileType + "'";
			//Need to be changed @Javy
			window.open(sDownloadURL);
			//this._exportTemplate(sDownloadURL);
			this._oDownloadDialog.close();
		},

		onDownloadPress: function () {
			//Open download dialog.
			if (!this._oDownloadDialog) {
				this._oDownloadDialog = sap.ui.xmlfragment(this.getView().getId(), Constants.DownloadDialogFragmentID, this);
				this.getView().addDependent(this._oDownloadDialog);
			}
			this._oDownloadDialog.open();
		},

		onDownloadCancelPressed: function () {
			this._oDownloadDialog.close();
		},

		/* =========================================================== */
		/* Methods of Pressing entry                                   */
		/* =========================================================== */

		handleItemPressed: function (oEvent) {
			var that = this;
			var oListItem = oEvent.getParameter("listItem");
			var oObject = oListItem.getBindingContext().getObject();
			var sRootKey = oObject.RootKey;
			var sKey = oObject.Key;
			if (sRootKey) {
				var sSemanticObject = "SupplierInvoice";
				var sActionName = "process";
				var oNavigationParameters = {
					DBKey: sRootKey
				};

				if (oObject.StatusCode !== "10" && oObject.FiscalYear !== "0000" && oObject.SupplierInvoice !== "") {
					oNavigationParameters.FiscalYear = oObject.FiscalYear;
					oNavigationParameters.SupplierInvoice = oObject.SupplierInvoice;
				}

				var oInnerAppData = {
					customData: {
						// User: this._sCreatedBy,
						RootKey: sRootKey,
						Key: sKey
					}
				};

				// callback function in case of errors
				var fnOnError = function (oError) {
					MessageBox.error(that.getResourceBundle().getText("OUTBOUND_NAV_ERROR"));
				};
				this.oNavigationHandler.navigate(sSemanticObject, sActionName, oNavigationParameters, oInnerAppData, fnOnError);
			}
		},

		/* =========================================================== */
		/* Methods of ShowLog press                                    */
		/* =========================================================== */

		handleShowLogPress: function (oEvent) {
			this.onShowLogButtonPressed(oEvent);
		},

		onShowLogButtonPressed: function (oEvent) {
			var aSelectedItems = this._oWorklistTable.getSelectedItems();
			if (aSelectedItems.length !== 1) {
				this.navToApplicationLog();
			} else {
				if (!this.Key) {
					var oListItem = aSelectedItems[0];
					var oObject = oListItem.getBindingContext().getObject();
					this.Key = oObject.Key;
				}
				this.getLoghandle(this.Key);
			}
		},

		navToApplicationLog: function () {
			var that = this;
			var oParameters = {
				"LogObjectId": "FAP_ISI",
				"LogExternalId": "",
				"PersKey": "fin.ap.invoice.upload.ShowLog"
			};
			if (this.RootKey) {
				oParameters.LogExternalId = this.RootKey;
			}
			// var oInnerAppState = this._generateAppState();
			var oInnerAppState = {};
			this.oRouter.detachRouteMatched(this.onRouteMatched, this);

			// callback function in case of errors
			var fnOnError = function (oError) {
				MessageBox.error(that.getResourceBundle().getText("OUTBOUND_NAV_ERROR"));
			};

			this.oNavigationHandler.navigate("ApplicationLog", "showList", oParameters, oInnerAppState, fnOnError);
		},

		getLoghandle: function (sKey) {
			var that = this;
			var oParameters = {
				Key: sKey
			};
			var successCallback = jQuery.proxy(function (oData, oResponse) {
				if (oData && oData.GetLogHandle && oData.GetLogHandle.LogHandleID) {
					var oNavigationParameters = {
						"LogHandle": oData.GetLogHandle.LogHandleID
					};
					var oInnerAppData = {
						customData: {
							// CreatedBy: that._sCreatedBy
						}
					};

					var fnOnError = function (oError) {
						MessageBox.error(that.getResourceBundle().getText("OUTBOUND_NAV_ERROR"));
					};

					that.oNavigationHandler.navigate("ApplicationLog", "showDetails", oNavigationParameters, oInnerAppData, fnOnError);
				} else {
					that.navToApplicationLog();
				}
			}, this);
			var errorCallBack = jQuery.proxy(function (oError) {
				MessageBox.error(oError.message, {
					onClose: function () {
						that._oWorklistSmartTable.rebindTable();
					},
					details: oError.responseText
				});
				jQuery.sap.log.error("fin.ap.invoice.upload.controller.Worklist",
					"Get Current User error, as " + oError.message + "\r\n" + oError.responseText);
			}, this);

			var oPromise = this.getView().getModel().callFunction("/GetLogHandle", {
				method: "POST",
				urlParameters: oParameters,
				success: successCallback,
				error: errorCallBack
			});
			return oPromise.contextCreated();
		},

		/* =========================================================== */
		/* Methods of Post/Check/Delete/SetToComplete/MassEdit press   */
		/* =========================================================== */

		onPostPressed: function () {
			this.sAction = "Post";
			this._onBtnPressed("Post");
		},

		onCheckPressed: function () {
			this.sAction = "Check";
			this._onBtnPressed("Check");
		},

		onDeletePress: function () {
			this.sAction = "Delete";
			this._onBtnPressed("Delete");
		},

		onSubmitPress: function () {
			this.sAction = "Submit";
			this._onBtnPressed("ParkAsCompleted");
		},

		onEditPress: function () {
			this.sAction = "Edit";
			this._onBtnPressed("Update");
		},

		_onBtnPressed: function (sActionName) {

			var that = this;
			var aSelectedItems = this._oWorklistTable.getSelectedItems();
			var oObject,
				aEntry = [],
				aEntryChkDup = [],
				aEntryNotChkDup = [];

			this._aSelectedItems = this._oWorklistTable.getSelectedItems();
			//Set the counters
			this._iActionTotalNum = aSelectedItems.length;
			this._iActionNotFinished = aSelectedItems.length;
			this._iActionSuccessNum = 0;
			this._iDuplicateCheckNotFinished = 0;
			this._aEntriesNotDuplicate = [];

			if (aSelectedItems.length <= 0) {
				MessageBox.error(this.getResourceBundle().getText("SelectOneItem"));
			} else {

				for (var i = 0; i < aSelectedItems.length; i++) {
					var oParameter = {};
					oObject = aSelectedItems[i].getBindingContext().getObject();
					oParameter.RootKey = oObject.RootKey;
					oParameter.Key = oObject.Key;
					aEntry.push(oParameter);
					//Seprate the entries into need duplicate check or not
					if (oObject.CheckDuplicate === "X") {
						aEntryChkDup.push(oParameter);
					} else {
						aEntryNotChkDup.push(oParameter);
					}
				}

				switch (sActionName) {

				case "Delete":
					{
						//Delete Confirmation Box
						MessageBox.confirm(this.getResourceBundle().getText("DeleteConfirmation"), {
							title: this.getResourceBundle().getText("Delete"),
							actions: [sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL],
							onClose: function (oAction) {
								if (oAction === sap.m.MessageBox.Action.DELETE) {
									that._doActionSelectedDocuments(sActionName, aEntry);
								}
							}
						});
						break;
					}
				case "Update":
					{
						//Edit Popup
						if (!this._oEditDialogCtrl) {
							this._oEditDialogCtrl = new EditDialog(this, aEntry);
						}
						if (!this._oEditDialog) {
							this._oEditDialog = sap.ui.xmlfragment(this.getView().getId(), Constants.EditDialogFragmentID, this._oEditDialogCtrl);
							this.getView().addDependent(this._oEditDialog);
						}
						// this._oEditDialog.setTitle(this.getResourceBundle().getText("Edit"));
						this._oEditDialog.open();
						break;
					}

				case "Post":
				case "Check":
					{
						//first do the duplicate check for needed entries
						this._doActionSelectedDocuments("DuplicateCheck", aEntryChkDup, sActionName);
						this._doActionSelectedDocuments(sActionName, aEntryNotChkDup);
						break;
					}

				default:
					{
						this._doActionSelectedDocuments(sActionName, aEntry);
						break;
					}
				}
			}

		},

		_doActionSelectedDocuments: function (sActionName, aIndices, sActionNameAft, oUpdateParameter) {

			var iIndex, oObject, sGroupId;
			var oRequestParameter = (oUpdateParameter === undefined) ? {} : oUpdateParameter;

			if (aIndices && aIndices.length > 0) {
				switch (sActionName) {

				case "Post":
					{ // for performance issue, put 10 entries into 1 request 
						var ilength = aIndices.length;
						var iNumberPerBatch = 10;
						var iBatchCounter = Math.ceil(ilength / iNumberPerBatch);
						iIndex = 0;
						for (var iCounter = 0; iCounter < iBatchCounter; iCounter++) {
							var sCombinedKey = "";
							for (var iTenCounter = 0; iTenCounter < iNumberPerBatch; iTenCounter++) {
								if (iIndex < ilength) {
									oObject = aIndices[iIndex];
									if (sCombinedKey === "") {
										sCombinedKey = oObject.RootKey + "+" + oObject.Key;
									} else {
										sCombinedKey = oObject.RootKey + "+" + oObject.Key + "," + sCombinedKey;
									}
									iIndex++;
								}
							}
							oRequestParameter.CombinedKey = sCombinedKey;
							sGroupId = sActionName + iIndex;
							this._singlePostThroughGUID(oRequestParameter, sGroupId);
						}
						break;
					}

				case "DuplicateCheck":
					{
						this._iDuplicateCheckNotFinished = aIndices.length;
						for (iIndex = 0; iIndex < aIndices.length; iIndex++) {
							oObject = aIndices[iIndex];
							oRequestParameter.Key = oObject.Key;
							this._singleDuplicateCheckThroughGUID(oRequestParameter);
						}
						break;
					}

				default:

					{
						for (iIndex = 0; iIndex < aIndices.length; iIndex++) {
							oObject = aIndices[iIndex];
							oRequestParameter.RootKey = oObject.RootKey;
							oRequestParameter.Key = oObject.Key;
							sGroupId = sActionName + iIndex;
							this._singleActionThroughGUID(sActionName, oRequestParameter, sGroupId);
						}
						break;
					}
				}
				this._oPage.setBusy(true);
				if (sActionName === "DuplicateCheck") {
					this._checkDuplicateCheckFinish(sActionNameAft);
				} else {
					this._checkBatchRequestFinish();
				}
			}

		},

		_checkBatchRequestFinish: function () {
			//Check if all the select entries have been posted.
			if (this._iActionNotFinished <= 0) {
				//All the post entry requests have got responses.
				//this._bUseOldFilter = true;
				this._oWorklistSmartTable.rebindTable();
				this._showPostFinishInfoMsgBox();
				this._oPage.setBusy(false);

			} else {
				//Call this function recursively after a short delay.
				jQuery.sap.delayedCall(50, this, this._checkBatchRequestFinish);
			}

		},

		_checkDuplicateCheckFinish: function (sActionNameAft) {
			//Check if the duplicate check is finished
			if (this._iDuplicateCheckNotFinished <= 0) {
				if (this._aEntriesNotDuplicate.length !== 0) {
					this._doActionSelectedDocuments(sActionNameAft, this._aEntriesNotDuplicate);
				} else {
					this._checkBatchRequestFinish();
				}
			} else {
				//Call this function recursively after a short delay.
				jQuery.sap.delayedCall(50, this, this._checkDuplicateCheckFinish, [sActionNameAft]);
			}

		},

		_singlePostThroughGUID: function (oParameters, sGroupId) {
			//Post one entry through HoldDocumentGUID.

			var fnPostSuccess = jQuery.proxy(function (oData, oResponse) {
				var iPostSuccessNum;
				if (oData.Post && oData.Post.Counter) {
					iPostSuccessNum = oData.Post.Counter;
				}
				if (iPostSuccessNum >= 0) {
					this._iActionSuccessNum += iPostSuccessNum;
				} else {
					var sMsgStr = oResponse.headers["sap-message"];
					if (sMsgStr) {
						try {
							var oMessages = jQuery.parseJSON(sMsgStr);
							var oErrorDetails = oMessages.getElementsByTagName("errordetails");
							if (oErrorDetails && oErrorDetails[0].childNodes) {
								var aMessages = oErrorDetails[0].childNodes;
								var sMsg = aMessages[0].getElementsByTagName("message")[0].textContent;
								var sSeverity = aMessages[0].getElementsByTagName("severity")[0].textContent;
								if (sSeverity === "error") {
									MessageBox.error(sMsg);
								}
							}
						} catch (oException) {
							jQuery.sap.log.error("fin.ap.invoice.upload.controller.Worklist",
								"parse error, as " + oException.message);
						}
					}
				}
				this._iActionNotFinished = this._iActionNotFinished - 10;
			}, this);
			var fnPostError = jQuery.proxy(function (oError) {
				this._iActionNotFinished = this._iActionNotFinished - 10;
				MessageBox.error(oError.message, {
					details: oError.responseText
				});
			}, this);
			var oPromise = this.getView().getModel().callFunction("/Post", {
				method: "GET",
				urlParameters: oParameters,
				groupId: sGroupId,
				success: fnPostSuccess,
				error: fnPostError
			});
			return oPromise.contextCreated();
		},

		_singleActionThroughGUID: function (sActionName, oParameters, sGroupId) {

			var fnSuccess = jQuery.proxy(function (oData, oResponse) {
				var iActionSuccessNum;
				var oDataResult = oData[sActionName];
				if (oDataResult && oDataResult.ActionOk !== false) {
					iActionSuccessNum = 1;
				} else {
					iActionSuccessNum = 0;
				}

				if (iActionSuccessNum > 0) {
					this._iActionSuccessNum += iActionSuccessNum;
				} else {
					var sMsgStr = oResponse.headers["sap-message"];
					if (sMsgStr) {
						try {
							var oMessages = jQuery.parseJSON(sMsgStr);
							MessageBox.error(oMessages.message);
						} catch (oException) {
							jQuery.sap.log.error("fin.ap.invoice.upload.controller.Worklist",
								"parse error, as " + oException.message);
						}
						// var aMsgArray = this._parsePostMessage(oMessages);
						// if (aMsgArray.length > 0) {
						// 	//Add the message array to the global variate.
						// 	Array.prototype.push.apply(this._aMsgArrayForSinglePost, aMsgArray);
						// }
					}
				}
				this._iActionNotFinished--;
			}, this);

			var fnError = jQuery.proxy(function (oError) {
				this._iActionNotFinished--;
				MessageBox.error(oError.message, {
					details: oError.responseText
				});
			}, this);
			var sActionURI = "/" + sActionName;
			var oPromise = this.getView().getModel().callFunction(sActionURI, {
				method: "GET",
				urlParameters: oParameters,
				groupId: sGroupId,
				success: fnSuccess,
				error: fnError
			});
			return oPromise.contextCreated();

		},

		_singleDuplicateCheckThroughGUID: function (oParameters) {

			var sActionName = "DuplicateCheck";
			// var sGroupID = sActionName;
			// var sChangeSetID = sActionName;

			var fnDuplicateCheckSuccess = jQuery.proxy(function (oData, oResponse) {
				this._iDuplicateCheckNotFinished--;
				var oDataResult = oData[sActionName];
				if (oDataResult) {
					if (oDataResult.ActionOk === true) {
						var aEntry = {
							RootKey: oDataResult.RootKey,
							Key: oDataResult.Key
						};
						this._aEntriesNotDuplicate.push(aEntry);
					} else {
						this._iActionNotFinished--;
					}
				}
			}, this);

			var fnDuplicateCheckError = jQuery.proxy(function (oError) {
				this._iDuplicateCheckNotFinished--;
				MessageBox.error(oError.message, {
					details: oError.responseText
				});
			}, this);

			var oPromise = this.getView().getModel().callFunction("/DuplicateCheck", {
				method: "POST",
				urlParameters: oParameters,
				// groupId: sGroupID,
				// changeSetId: sChangeSetID,
				success: fnDuplicateCheckSuccess,
				error: fnDuplicateCheckError
			});
			return oPromise.contextCreated();
		},

		_getPostEnabled: function () {

			var sActionName = "PostEnabled";

			var fnSuccessCallback = jQuery.proxy(function (oData, oResponse) {

				var oDataResult = oData[sActionName];
				if (oDataResult) {
					if (oDataResult.ActionOk === true) {
						var oUIModel = this.getView().getModel("ui");
						oUIModel.setProperty("/postBtnVisible", true);
					}
				} else {
					MessageBox.error(this.getResourceBundle().getText("ErrorOccur"));
				}
			}, this);
			var fnErrorCallBack = jQuery.proxy(function (oError) {
				MessageBox.error(oError.message, {
					details: oError.response
				});
				jQuery.sap.log.error("fin.ap.invoice.upload.controller.Worklist",
					"Get PostEnabled error, as " + oError.message + "\r\n" + oError.response);
			}, this);

			var sActionURI = "/" + sActionName;
			var oPromise = this.getView().getModel().callFunction(sActionURI, {
				method: "GET",
				success: fnSuccessCallback,
				error: fnErrorCallBack
			});
			return oPromise.contextCreated();
		},

		singleCheck: function (oParameters) {

			var fnCheckSuccess = jQuery.proxy(function (oData, oResponse) {
				this._oPage.setBusy(false);
				this._oWorklistSmartTable.rebindTable();
			}, this);
			var fnCheckError = jQuery.proxy(function (oError) {
				this._oPage.setBusy(false);
				this._oWorklistSmartTable.rebindTable();
				MessageBox.error(oError.message, {
					details: oError.responseText
				});
			}, this);

			var oModel = this.getOwnerComponent().getModel();

			oModel.callFunction("/Check", {
				method: "GET",
				urlParameters: oParameters,
				success: fnCheckSuccess,
				error: fnCheckError
			});

			this._oPage.setBusy(true);

		},

		_showPostFinishInfoMsgBox: function () {
			//Show the message box to tell user how many entries have been posted.
			var oUIModel = this.getView().getModel("ui");
			var sNumPosted = this._iActionSuccessNum.toString();
			var iErrorNum = this._iActionTotalNum - this._iActionSuccessNum;
			var sSuccessText, sErrorText;
			if (iErrorNum > 0) {
				oUIModel.setProperty("/Success", false);
				oUIModel.setProperty("/Error", true);
			} else {
				oUIModel.setProperty("/Success", true);
				oUIModel.setProperty("/Error", false);
			}

			switch (this.sAction) {
			case "Check":
				{
					sSuccessText = (this._iActionSuccessNum === 1) ? this.getResourceBundle().getText("SingleCheckedSuccess", sNumPosted) : this.getResourceBundle()
						.getText("CheckedSuccess", sNumPosted);
					sErrorText = (iErrorNum === 1) ? this.getResourceBundle().getText("SingleCheckedFailed", iErrorNum) : this.getResourceBundle().getText(
						"CheckedFailed", iErrorNum);
					break;
				}
			case "Delete":
				{
					sSuccessText = (this._iActionSuccessNum === 1) ? this.getResourceBundle().getText("SingleDeletedSuccess", sNumPosted) : this.getResourceBundle()
						.getText("DeletedSuccess", sNumPosted);
					sErrorText = (iErrorNum === 1) ? this.getResourceBundle().getText("SingleDeletedFailed", iErrorNum) : this.getResourceBundle().getText(
						"DeletedFailed", iErrorNum);
					break;
				}
			case "Submit":
				{
					sSuccessText = (this._iActionSuccessNum === 1) ? this.getResourceBundle().getText("SingleSubmitSuccess", sNumPosted) : this
						.getResourceBundle()
						.getText("SingleSubmitSuccess", sNumPosted);
					sErrorText = (iErrorNum === 1) ? this.getResourceBundle().getText("SubmitFailed", iErrorNum) : this.getResourceBundle()
						.getText(
							"SubmitFailed", iErrorNum);
					break;
				}
			case "Edit":
				{
					sSuccessText = (this._iActionSuccessNum === 1) ? this.getResourceBundle().getText("SingleEditSuccess", sNumPosted) : this.getResourceBundle()
						.getText("EditSuccess", sNumPosted);
					sErrorText = (iErrorNum === 1) ? this.getResourceBundle().getText("SingleEditFailed", iErrorNum) : this.getResourceBundle().getText(
						"EditFailed", iErrorNum);
					break;
				}
			case "Post":
				{
					sSuccessText = (this._iActionSuccessNum === 1) ? this.getResourceBundle().getText("SinglePostedSuccess", sNumPosted) : this.getResourceBundle()
						.getText("PostedSuccess", sNumPosted);
					sErrorText = (iErrorNum === 1) ? this.getResourceBundle().getText("SinglePostedFailed", iErrorNum) : this.getResourceBundle().getText(
						"PostedFailed", iErrorNum);
					break;
				}
			default:
				{
					break;
				}
			}
			oUIModel.setProperty("/SuccessText", sSuccessText);
			oUIModel.setProperty("/ErrorText", sErrorText);

			this.openMessageBox();
		},

		openMessageBox: function () {
			if (!this._oMessageDialog) {
				this._oMessageDialog = sap.ui.xmlfragment(this.getView().getId(), Constants.MessageDialogFragmentID, this);
				this.getView().addDependent(this._oMessageDialog);
			}

			this._oMessageDialog.addStyleClass("sapMMessageBoxInfo");
			this._oMessageDialog.setIcon(IconPool.getIconURI("message-information"));
			this._oMessageDialog.setTitle(this.getResourceBundle().getText("Information"));

			this._oMessageDialog.open();
		},

		onMessageCancelPressed: function () {
			this._oMessageDialog.close();
		},

		/* =========================================================== */
		/* Method of Feature Toggle   */
		/* =========================================================== */

		_featureToggleForEdit: function () {
			//feature toggle for the Edit button
			var successCallback = jQuery.proxy(function (oData, oResponse) {
				// this._oPage.setBusy(false);
				if (oData && oData.results) {
					if (oData.results[0].ToggleId === "FI_AP_ISI_EDIT" && oData.results[0].ToggleActive === true) {
						var oUIModel = this.getView().getModel("ui");
						oUIModel.setProperty("/editBtnVisible", true);
					}
				} else {
					MessageBox.error(this.getResourceBundle().getText("ErrorOccur"));
				}
			}, this);
			var errorCallBack = jQuery.proxy(function (oError) {
				// this._oPage.setBusy(false);
				MessageBox.error(oError.message, {
					details: oError.response
				});
				jQuery.sap.log.error("fin.ap.invoice.upload.controller.Worklist",
					"Get Feature Toggle error, as " + oError.message + "\r\n" + oError.response);
			}, this);

			this.getOwnerComponent().getModel().read("/FeatureToggleSet", {
				success: successCallback,
				error: errorCallBack
			});

		}

	});

});