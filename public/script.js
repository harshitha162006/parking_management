const schemas = {
  users: { title:"Users", description:"Add and manage registered users.", primary:"user_id", fields:[
    ["name","Name","text",true],["phone","Phone","tel",true],["email","Email","email",true],["role","Role","select",true,["Admin","User","Customer"]]
  ]},
  parking_slots: { title:"Parking Slots", description:"Manage parking spaces and availability.", primary:"slot_id", fields:[
    ["slot_number","Slot Number","text",true],["vehicle_type","Vehicle Type","select",true,["Two Wheeler","Four Wheeler","Bike","Car","Other"]],["location","Location","text",true],["status","Status","select",true,["Available","Occupied","Maintenance"]]
  ]},
  vehicles: { title:"Vehicles", description:"Register and update user vehicles.", primary:"vehicle_id", fields:[
    ["user_id","User ID","number",true],["vehicle_number","Vehicle Number","text",true],["vehicle_type","Vehicle Type","select",true,["Two Wheeler","Four Wheeler","Bike","Car","Other"]],["vehicle_model","Vehicle Model","text",true]
  ]},
  parking_records: { title:"Parking Records", description:"Track vehicle entry, exit and parking fees.", primary:"record_id", fields:[
    ["vehicle_id","Vehicle ID","number",true],["slot_id","Slot ID","number",true],["entry_time","Entry Time","datetime-local",true],["exit_time","Exit Time","datetime-local",false],["parking_fee","Parking Fee","number",false],["status","Status","select",true,["Active","Completed","Pending"]]
  ]}
};
let currentTable="users", currentRows=[], editingId=null;
const $=id=>document.getElementById(id);
const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function showMessage(text,error=false){$("message").textContent=text;$("message").className=error?"message error":"message";}
async function request(url,options={}){const response=await fetch(url,{headers:{"Content-Type":"application/json"},...options});const data=await response.json().catch(()=>({message:"Unexpected server response"}));if(!response.ok)throw new Error(data.message||"Request failed");return data;}
async function checkConnection(){try{await request("/api/health");$("connection").textContent="● MySQL Connected";$("connection").className="connection ok";}catch(e){$("connection").textContent="● Database not connected";$("connection").className="connection bad";}}
function renderTable(){
  const schema=schemas[currentTable];$("tableTitle").textContent=schema.title;$("tableDescription").textContent=schema.description;
  const headers=[schema.primary,...schema.fields.map(f=>f[0]),"Actions"];
  $("tableHead").innerHTML="<tr>"+headers.map(h=>`<th>${escapeHtml(h.replaceAll("_"," "))}</th>`).join("")+"</tr>";
  if(!currentRows.length){$("tableBody").innerHTML=`<tr><td colspan="${headers.length}" class="empty">No records found. Click “Add New” to create your first record.</td></tr>`;return;}
  $("tableBody").innerHTML=currentRows.map(row=>`<tr>
    ${headers.slice(0,-1).map(h=>`<td>${escapeHtml(row[h])}</td>`).join("")}
    <td><div class="actions"><button class="edit-btn" data-edit="${escapeHtml(row[schema.primary])}">Edit</button><button class="delete-btn" data-delete="${escapeHtml(row[schema.primary])}">Delete</button></div></td>
  </tr>`).join("");
}
async function loadTable(){
  try{currentRows=await request(`/api/${currentTable}`);renderTable();$("usersCount").textContent=currentTable==="users"?currentRows.length:$("usersCount").textContent;
    // Update all dashboard counts without changing the selected tab.
    const names=["users","parking_slots","vehicles","parking_records"];
    const counts=await Promise.all(names.map(async name=>(await request(`/api/${name}`)).length));
    ["usersCount","slotsCount","vehiclesCount","recordsCount"].forEach((id,i)=>$(id).textContent=counts[i]);
    showMessage("");
  }catch(e){currentRows=[];renderTable();showMessage(e.message,true);}
}
function openForm(row=null){
  editingId=row?row[schemas[currentTable].primary]:null;
  $("formTitle").textContent=row?"Update "+schemas[currentTable].title:"Add "+schemas[currentTable].title;
  const fields=schemas[currentTable].fields;
  $("formFields").innerHTML=fields.map(f=>{
    const [name,label,type,required,options]=f;let value=row?.[name]??"";
    if(type==="datetime-local"&&value){const d=new Date(value);if(!Number.isNaN(d.getTime()))value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);else value=String(value).replace(" ","T").slice(0,16);}
    let control=type==="select"?`<select id="field_${name}" ${required?"required":""}><option value="">Select ${label}</option>${options.map(o=>`<option ${String(value).toLowerCase()===o.toLowerCase()?"selected":""} value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("")}</select>`:`<input id="field_${name}" type="${type}" value="${escapeHtml(value)}" ${required?"required":""} ${type==="number"&&name==="parking_fee"?'min="0" step="0.01"':""}>`;
    return `<div class="field"><label for="field_${name}">${label}${required?" *":""}</label>${control}</div>`;
  }).join("");
  $("modal").classList.remove("hidden");
}
function closeForm(){$("modal").classList.add("hidden");$("recordForm").reset();editingId=null;}
$("addBtn").addEventListener("click",()=>openForm());
$("closeModal").addEventListener("click",closeForm);$("cancelBtn").addEventListener("click",closeForm);
$("refreshBtn").addEventListener("click",()=>{checkConnection();loadTable();});
document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{document.querySelector(".tab.active").classList.remove("active");btn.classList.add("active");currentTable=btn.dataset.table;loadTable();}));
$("tableBody").addEventListener("click",async event=>{
  const edit=event.target.closest("[data-edit]"),del=event.target.closest("[data-delete]");
  if(edit){const row=currentRows.find(r=>String(r[schemas[currentTable].primary])===edit.dataset.edit);openForm(row);}
  if(del&&confirm("Are you sure you want to delete this record?")){
    try{await request(`/api/${currentTable}/${encodeURIComponent(del.dataset.delete)}`,{method:"DELETE"});showMessage("Record deleted successfully.");await loadTable();}
    catch(e){showMessage(e.message,true);}
  }
});
$("recordForm").addEventListener("submit",async event=>{
  event.preventDefault();const body={};
  for(const [name,label,type] of schemas[currentTable].fields){const value=$("field_"+name).value;body[name]=value===""?null:value;}
  try{
    const url=editingId?`/api/${currentTable}/${encodeURIComponent(editingId)}`:`/api/${currentTable}`;
    await request(url,{method:editingId?"PUT":"POST",body:JSON.stringify(body)});
    closeForm();showMessage(editingId?"Record updated successfully.":"Record created successfully.");await loadTable();
  }catch(e){showMessage(e.message,true);}
});
checkConnection();loadTable();
