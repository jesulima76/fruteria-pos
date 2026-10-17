/**
 * FRUTERÍA POS - Backend de Google Apps Script.
 * La hoja de cálculo debe tener pestañas: Productos, Ventas y DetalleVentas.
 * Ejecuta setupFruteria() una sola vez desde el editor para crear encabezados.
 */
const SHEET_PRODUCTS = 'Productos';
const SHEET_SALES = 'Ventas';
const SHEET_DETAILS = 'DetalleVentas';

function setupFruteria() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, SHEET_PRODUCTS, ['id','nombre','categoria','unidad','precio','stock','activo']);
  ensureSheet_(ss, SHEET_SALES, ['id','fecha','total','metodo_pago','monto_recibido','cambio']);
  ensureSheet_(ss, SHEET_DETAILS, ['venta_id','producto_id','producto','cantidad','unidad','precio_unitario','subtotal']);
  const sh = ss.getSheetByName(SHEET_PRODUCTS);
  if (sh.getLastRow() === 1) {
    sh.getRange(2,1,5,7).setValues([
      ['P001','Manzana','Frutas','kg',2.50,30,true],
      ['P002','Banano','Frutas','kg',1.20,40,true],
      ['P003','Naranja','Frutas','kg',1.80,35,true],
      ['P004','Tomate','Verduras','kg',1.50,25,true],
      ['P005','Papa','Verduras','kg',1.00,50,true]
    ]);
  }
  SpreadsheetApp.getUi().alert('Estructura creada. Abre la pestaña Productos para editar los artículos y precios.');
}
function ensureSheet_(ss,name,headers) {
  let sh=ss.getSheetByName(name); if(!sh) sh=ss.insertSheet(name);
  if(sh.getLastRow()===0) sh.getRange(1,1,1,headers.length).setValues([headers]);
  sh.setFrozenRows(1); sh.getRange(1,1,1,headers.length).setFontWeight('bold');
}
function doGet() {
  return json_({ok:true,message:'API Frutería POS activa. Envía solicitudes POST desde la aplicación.'});
}
function doPost(e) {
  const lock=LockService.getScriptLock();
  try {
    const payload=JSON.parse((e.postData && e.postData.contents)||'{}');
    lock.waitLock(15000);
    let result;
    if(payload.action==='init') result=init_();
    else if(payload.action==='checkout') result=checkout_(payload);
    else throw new Error('Acción no reconocida.');
    return json_({ok:true,...result});
  } catch(err) {
    return json_({ok:false,error:String(err.message||err)});
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}
function init_() {
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const products=readObjects_(ss.getSheetByName(SHEET_PRODUCTS)).filter(p=>p.activo===true||String(p.activo).toLowerCase()==='true'||p.activo===1).map(p=>({
    id:String(p.id),nombre:String(p.nombre),categoria:String(p.categoria||''),unidad:String(p.unidad||'unidad'),precio:Number(p.precio)||0,stock:Number(p.stock)||0
  }));
  const sales=readObjects_(ss.getSheetByName(SHEET_SALES)).slice(-10).reverse().map(s=>({id:String(s.id),fecha:String(s.fecha),total:Number(s.total)||0,metodo_pago:String(s.metodo_pago||'')}));
  return {products,sales};
}
function checkout_(payload) {
  if(!Array.isArray(payload.items)||!payload.items.length) throw new Error('La venta no contiene productos.');
  const ss=SpreadsheetApp.getActiveSpreadsheet(), ps=ss.getSheetByName(SHEET_PRODUCTS), shSales=ss.getSheetByName(SHEET_SALES), shDetails=ss.getSheetByName(SHEET_DETAILS);
  const all=readObjects_(ps), byId={}; all.forEach((p,i)=>byId[String(p.id)]={p,row:i+2});
  let total=0, lines=[];
  payload.items.forEach(it=>{
    const found=byId[String(it.id)]; if(!found) throw new Error('Producto no encontrado: '+it.nombre);
    const qty=Number(it.cantidad), price=Number(found.p.precio), stock=Number(found.p.stock);
    if(!(qty>0)||!Number.isFinite(qty)) throw new Error('Cantidad inválida.');
    if(qty>stock) throw new Error('Stock insuficiente para '+found.p.nombre+'. Disponible: '+stock);
    const subtotal=qty*price; total+=subtotal;
    lines.push({found,qty,price,subtotal});
  });
  total=Math.round((total+Number.EPSILON)*100)/100;
  const received=Number(payload.monto_recibido)||0;
  if(received>0&&received<total) throw new Error('El monto recibido es menor que el total.');
  const saleId='V-'+Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyyMMdd-HHmmss')+'-'+Math.floor(Math.random()*900+100);
  const now=Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd HH:mm:ss');
  shSales.appendRow([saleId,now,total,String(payload.metodo_pago||'Efectivo'),received,Math.max(0,Math.round((received-total+Number.EPSILON)*100)/100)]);
  lines.forEach(l=>{
    shDetails.appendRow([saleId,String(l.found.p.id),String(l.found.p.nombre),l.qty,String(l.found.p.unidad||'unidad'),l.price,l.subtotal]);
    ps.getRange(l.found.row,6).setValue(Number(l.found.p.stock)-l.qty);
  });
  return {saleId,total};
}
function readObjects_(sheet) {
  if(!sheet) throw new Error('Falta una pestaña. Ejecuta setupFruteria() desde Apps Script.');
  const values=sheet.getDataRange().getValues(); if(values.length<2) return [];
  const headers=values[0].map(String);
  return values.slice(1).filter(r=>r.some(v=>v!=='')).map(r=>{const o={};headers.forEach((h,i)=>o[h]=r[i]);return o;});
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}