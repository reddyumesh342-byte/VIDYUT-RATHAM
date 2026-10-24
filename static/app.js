let running=false,mode="normal",t=0,energy=0,car=14;
const $=id=>document.getElementById(id);
const logs=[];
function log(s){logs.unshift(`[${new Date().toLocaleTimeString()}] ${s}`);$("log").textContent=logs.slice(0,35).join("\\n")}
function setMode(m){mode=m;log("Mode changed → "+m.toUpperCase());$("recoveryStatus").textContent=m==="normal"?"OFF":"CONTROLLED ON"}
$("runBtn").onclick=()=>{running=!running;$("runBtn").textContent=running?"STOP SYSTEM":"START SYSTEM";log(running?"System started":"System stopped")};
let pc,sc;
function initCharts(){
 const common={responsive:true,animation:false,plugins:{legend:{labels:{color:"#a7bdd6"}}},scales:{x:{display:false},y:{ticks:{color:"#7e96b2"},grid:{color:"#1b3048"}}}};
 pc=new Chart(document.getElementById("powerChart"),{type:"line",data:{labels:[],datasets:[
 {label:"Solar",data:[],borderColor:"#5ab5ff",tension:.3},{label:"Motor",data:[],borderColor:"#ffc45b",tension:.3},{label:"Recovered",data:[],borderColor:"#42dfa0",tension:.3}]},options:common});
 sc=new Chart(document.getElementById("socChart"),{type:"line",data:{labels:[],datasets:[{label:"Battery SOC %",data:[],borderColor:"#b58cff",backgroundColor:"#8d63ff22",fill:true,tension:.3}]},options:{...common,scales:{x:{display:false},y:{min:0,max:100,ticks:{color:"#7e96b2"},grid:{color:"#1b3048"}}}}});
}
function update(d){
 $("soc").textContent=d.soc.toFixed(0)+"%";$("socMeter").style.width=d.soc+"%";
 $("solar").textContent=d.solar.toFixed(0);$("motor").textContent=d.motor.toFixed(0);$("recovered").textContent=d.recovered.toFixed(0);$("speed").textContent=d.speed.toFixed(1);
 $("solarFlow").textContent=d.solar.toFixed(0)+" W";$("batteryFlow").textContent=d.soc.toFixed(0)+"%";$("motorFlow").textContent=d.motor.toFixed(0)+" W";$("duty").textContent=d.duty.toFixed(0)+"% PWM";
 $("bv").textContent=d.batteryVoltage.toFixed(2)+" V";$("gv").textContent=d.genVoltage.toFixed(2)+" V";$("gi").textContent=d.genCurrent.toFixed(2)+" A";$("pwm").textContent=d.duty.toFixed(0)+"%";
 energy+=d.recovered/3600*.25;$("energy").textContent=energy.toFixed(2)+" Wh";
 let score=Math.max(50,Math.min(98,88-Math.abs(d.motor-d.solar)*.05+d.recovered*.12));$("score").textContent=score.toFixed(0);
 let potential=Math.max(0,Math.min(65,(d.speed>22?42:8)+d.solar*.02));$("potential").textContent=potential.toFixed(0)+" W";
 let pred=Math.max(0,Math.min(100,d.soc+(d.solar+d.recovered-d.motor)*.012));$("predSoc").textContent=pred.toFixed(0)+"%";
 let risk=d.soc<25?"HIGH":d.motor>d.solar*1.8?"MEDIUM":"LOW";$("risk").textContent=risk;
 $("state").textContent=d.recovered>20?"RECOVERY":d.motor>190?"HIGH LOAD":"STABLE";
 $("confidence").textContent=(86+Math.random()*9).toFixed(0)+"%";
 if(mode==="recovery"||mode==="downhill"){$("aiTitle").textContent="AI recommends controlled recovery";$("aiText").textContent="Vehicle conditions indicate an opportunity to recover a portion of wheel energy. Apply recovery gradually and monitor generator current."; }else{$("aiTitle").textContent="AI recommends Normal Drive";$("aiText").textContent="Vehicle is in steady operation. Keep recovery disabled unless deceleration or another suitable operating condition is detected."}
 let n=pc.data.labels.length;if(n>55){pc.data.labels.shift();pc.data.datasets.forEach(x=>x.data.shift());sc.data.labels.shift();sc.data.datasets[0].data.shift()}
 pc.data.labels.push(n);pc.data.datasets[0].data.push(d.solar);pc.data.datasets[1].data.push(d.motor);pc.data.datasets[2].data.push(d.recovered);pc.update();
 sc.data.labels.push(n);sc.data.datasets[0].data.push(pred);sc.update();
 car+=running?Math.max(.15,d.speed*.012):0;if(car>92)car=5;document.querySelector(".car").style.left=car+"%";
}
function simulation(){
 let speed=running?(mode==="downhill"?25:18):0;
 let solar=running?105+Math.random()*30:75+Math.random()*20;
 let motor=running?(mode==="downhill"?95+Math.random()*15:145+Math.random()*35):0;
 let rec=running&&mode!=="normal"?(mode==="downhill"?38+Math.random()*25:12+Math.random()*18):0;
 let soc=Math.max(0,Math.min(100,72+(solar+rec-motor)*.0025));
 update({soc,solar,motor,recovered:rec,speed,duty:running?70:0,batteryVoltage:10.8+soc/100*1.8,genVoltage:rec?12.4:0,genCurrent:rec/12.4});
}
async function espPoll(){
 try{let r=await fetch("/api/data");if(!r.ok)throw 0;let d=await r.json();$("connection").textContent="● ESP32 LIVE";$("connection").className="pill online";update(d)}
 catch(e){$("connection").textContent="● SIMULATION";$("connection").className="pill offline"}
}
function clearLog(){logs.length=0;$("log").textContent=""}
initCharts();log("Dashboard initialized");setInterval(simulation,500);setInterval(espPoll,2000);