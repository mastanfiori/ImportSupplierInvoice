/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["fin/ap/invoice/upload/controller/BaseController","sap/ui/model/json/JSONModel"],function(B,J){"use strict";return B.extend("fin.ap.invoice.upload.controller.App",{onInit:function(){var v,s,o=this.getView().getBusyIndicatorDelay();var l=sap.ui.getCore().getConfiguration().getSAPLogonLanguage();v=new J({busy:true,delay:0,language:l});this.setModel(v,"appView");s=function(){v.setProperty("/busy",false);v.setProperty("/delay",o);};this.getOwnerComponent().getModel().metadataLoaded().then(s);this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());}});});
