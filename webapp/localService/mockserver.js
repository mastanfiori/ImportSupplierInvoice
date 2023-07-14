/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/util/MockServer"],function(M){"use strict";var m,_="fin/ap/invoice/upload/",a=_+"localService/mockdata";return{init:function(){var u=jQuery.sap.getUriParameters(),j=jQuery.sap.getModulePath(a),s=jQuery.sap.getModulePath(_+"manifest",".json"),e="InvoiceListSet",E=u.get("errorType"),i=E==="badRequest"?400:500,o=jQuery.sap.syncGetJSON(s).data,b=o["sap.app"].dataSources.mainService,c=jQuery.sap.getModulePath(_+b.settings.localUri.replace(".xml",""),".xml"),d=/.*\/$/.test(b.uri)?b.uri:b.uri+"/";m=new M({rootUri:d});M.config({autoRespond:true,autoRespondAfter:(u.get("serverDelay")||5)});m.simulate(c,{sMockdataBaseUrl:j,bGenerateMissingMockData:true});var r=m.getRequests(),R=function(f,g,h){h.response=function(x){x.respond(f,{"Content-Type":"text/plain;charset=utf-8"},g);};};if(u.get("metadataError")){r.forEach(function(f){if(f.path.toString().indexOf("$metadata")>-1){R(500,"metadata Error",f);}});}if(E){r.forEach(function(f){if(f.path.toString().indexOf(e)>-1){R(i,E,f);}});}r.push({method:"GET",path:new RegExp("GetCurrentUser"),response:function(x){jQuery.sap.log.debug("MockServer: incoming create request for url: "+x.url);return x.respond(200,{"Content-Type":"application/json;charset=utf-8"},JSON.stringify({d:{"GetCurrentUser":{"__metadata":{"type":"FAP_IMPORT_SUPPLIER_INVOICES.User"},"UserID":"TESTER"}}}));}});r.push({method:"GET",path:new RegExp("Post/?((.*)?)?"),response:function(x){jQuery.sap.log.debug("MockServer: incoming create request for url: "+x.url);if(x.url.indexOf("PostEnabled")<0){return x.respond(200,{"Content-Type":"application/json;charset=utf-8"},JSON.stringify({d:{"Post":{"__metadata":{"type":"FAP_IMPORT_SUPPLIER_INVOICES.ActionResultPost"},"ActionOk":false,"Counter":0,"SupplierInvoice":"","FiscalYear":"","SupplierInvoiceIsBlocked":false}}}));}else{return x.respond(200,{"Content-Type":"application/json;charset=utf-8"},JSON.stringify({d:{"PostEnabled":{"__metadata":{"type":"FAP_IMPORT_SUPPLIER_INVOICES.ActionResult"},"ActionOk":true}}}));}}});r.push({method:"GET",path:new RegExp("Check/?((.*)?)?"),response:function(x){jQuery.sap.log.debug("MockServer: incoming create request for url: "+x.url);return x.respond(200,{"Content-Type":"application/json;charset=utf-8"},JSON.stringify({d:{"Check":{"__metadata":{"type":"FAP_IMPORT_SUPPLIER_INVOICES.ActionResult"},"ActionOk":true}}}));}});r.push({method:"GET",path:new RegExp("Delete/?((.*)?)?"),response:function(x){jQuery.sap.log.debug("MockServer: incoming create request for url: "+x.url);return x.respond(200,{"Content-Type":"application/json;charset=utf-8"},JSON.stringify({d:{"Delete":{"__metadata":{"type":"FAP_IMPORT_SUPPLIER_INVOICES.ActionResult"},"ActionOk":true}}}));}});r.push({method:"GET",path:new RegExp("ParkAsCompleted/?((.*)?)?"),response:function(x){jQuery.sap.log.debug("MockServer: incoming create request for url: "+x.url);return x.respond(200,{"Content-Type":"application/json;charset=utf-8"},JSON.stringify({d:{"ParkAsCompleted":{"__metadata":{"type":"FAP_IMPORT_SUPPLIER_INVOICES.ActionResult"},"ActionOk":true}}}));}});r.push({method:"POST",path:new RegExp("GetLogHandle/?((.*)?)?"),response:function(x){jQuery.sap.log.debug("MockServer: incoming create request for url: "+x.url);return x.respond(200,{"Content-Type":"application/json;charset=utf-8"},JSON.stringify({d:{"GetLogHandle":{"__metadata":{"type":"FAP_IMPORT_SUPPLIER_INVOICES.LogHandle"},"LogHandleID":"b1Y2Wnnz7kUZawZzzcbvsm","LogNumber":"00000000000004613302"}}}));}});m.setRequests(r);m.start();jQuery.sap.log.info("Running the app with mock data");},getMockServer:function(){return m;}};});
