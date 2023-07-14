/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object","sap/m/MessageBox"],function(U,M){"use strict";return U.extend("fin.ap.invoice.upload.controller.ErrorHandler",{constructor:function(c){this._oResourceBundle=c.getModel("i18n").getResourceBundle();this._oComponent=c;this._oModel=c.getModel();this._bMessageOpen=false;this._sErrorText=this._oResourceBundle.getText("errorText");this._oModel.attachMetadataFailed(function(e){var p=e.getParameters();this._showServiceError(p.response);},this);this._oModel.attachRequestFailed(function(e){var p=e.getParameters();if(p.response.statusCode!=="404"||(p.response.statusCode===404&&p.response.responseText.indexOf("Cannot POST")===0)){this._showServiceError(p.response);}},this);},_showServiceError:function(d){if(this._bMessageOpen){return;}this._bMessageOpen=true;M.error(this._sErrorText,{id:"serviceErrorMessageBox",details:d,styleClass:this._oComponent.getContentDensityClass(),actions:[M.Action.CLOSE],onClose:function(){this._bMessageOpen=false;}.bind(this)});}});});
