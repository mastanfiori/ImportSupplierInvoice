/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"fin/ap/invoice/upload/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("fin.ap.invoice.upload.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);