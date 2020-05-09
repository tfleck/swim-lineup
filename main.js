var cookies = readCookies();
if (cookies.firstVisit) {
  $("#infoModal").modal('toggle');
  cookies.firstVisit = false;
  updateCookies(cookies);
}

var orig_arr;
var rpi_arr;
var record_obj;
var lineup_obj;
var bestLineup_obj;
var num_lineups = 0;
var num_best_lineup = 0;
var num_total_lineups = 0;

$("#csvInput").on("change", function() {
    //maybe check file here?
});

$('#calculateBtn').click(function() {
  if($('#csvInput').prop('files')[0] == null){
    return;
  }
  $('#calculateStatus').show(400, function(){
    Papa.parse($("#csvInput").prop('files')[0], {
      header: true,
      transformHeader:function(h) {
        let str = h.trim().toLowerCase();
        if( str == 'name'){
          return str;
        }
        return h.trim();
      },
      complete: function(results) {
        //console.log(results);
        orig_arr = results.data.filter(function (el) {
            return (el != null && el.name.length > 0);
        });
        if(orig_arr[0][Object.keys(orig_arr[0])[0]] === '_record'){
          record_obj = orig_arr[0];
          delete record_obj.name; //remove name attribute
          orig_arr.splice(0,1); //remove _record from swimmer data
        }
        rpi_arr = orig_arr.map(function(e) {
            //console.log(e);
            e = parseTimes(e);
            e = calculateRPI(e,record_obj);
            return e;
        });
        //console.log(rpi_arr);
        $("#csvInput").val(''); // reset file picker

        tryAllLineups();
        populateLineupTable();

        setTimeout(function(){
          $('#calculateStatus').hide(300);
          $('#lineupTableContainer').show(300);
        },1000);
      }
    });
  });
});

function populateLineupTable(){
  $('#lineupTable tbody').html('');
  Object.keys(bestLineup_obj).forEach(function(key){
    if( key != 'total_rpi'){
      $('#lineupTable tbody').append(`
        <tr>
          <th scope="row">${key}</th>
          <td>${bestLineup_obj[key]['name1']}</td>
          <td>${bestLineup_obj[key]['name2']}</td>
          <td>${bestLineup_obj[key]['name3']}</td>
        </tr>
      `);
    }
  });
  $('#lineupTableTitle').html(`
    <h4>Best Lineup - #${num_best_lineup}/${num_total_lineups}</h4>
    <h4 class="ml-auto">RPI: ${bestLineup_obj['total_rpi'].toFixed(3)}</h4>
  `);
}

function translateLineup(){
  Object.keys(bestLineup_obj).forEach(function(key){
    if( key != 'total_rpi'){
      bestLineup_obj[key]['name1'] = rpi_arr[bestLineup_obj[key]['name1']]['name'];
      bestLineup_obj[key]['name2'] = rpi_arr[bestLineup_obj[key]['name2']]['name'];
      bestLineup_obj[key]['name3'] = rpi_arr[bestLineup_obj[key]['name3']]['name'];
    }
  });
}

function findNameIndex(name){
  for(let i=0; i<rpi_arr.length; i++){
    if(rpi_arr[i]['name'] === name){
      return i;
    }
  }
  return -1; // name not found
}

function tryAllLineups(){
  num_total_lineups = factorialize(Object.keys(record_obj).length);
  bestLineup_obj = null;
  allOrders([], Object.keys(record_obj));
  translateLineup();
  console.log(bestLineup_obj)
}

function allOrders(order,left){
  if(left.length < 1){
      testLineup(order);
      return;
  }
  for(let i=0; i<left.length; i++){
    let left_copy = left.slice(0);
    left_copy.splice(i,1);
    let order_copy = order.slice(0);
    order_copy.push(left[i]);
    allOrders(order_copy, left_copy);
  }
}

function testLineup(order){
  rpi_arr.forEach(function(swimmer){
    swimmer['num_events'] = 0;
  });
  testLineup_obj = {};
  Object.keys(record_obj).forEach(function(key){
    testLineup_obj[key] = {
      'rpi1': 99999,
      'rpi2': 99999,
      'rpi3': 99999,
      'name1': -1,
      'name2': -1,
      'name3': -1
    }; 
  });
  order.forEach(function(event){
    //console.log(event);
    for(let i=0; i<rpi_arr.length; i++){
      let swimmer = rpi_arr[i];
      if(swimmer[event] > 0 && swimmer['num_events'] < 2){
        if(swimmer[event] > 0 && swimmer[event] < testLineup_obj[event]['rpi1']){
          if(testLineup_obj[event]['name1'] != -1){
            rpi_arr[testLineup_obj[event]['name1']]['num_events'] -= 1;
          }
          rpi_arr[i]['num_events'] += 1;
          testLineup_obj[event]['rpi1'] = swimmer[event];
          testLineup_obj[event]['name1'] = i;
        }
      }
    }
    for(let i=0; i<rpi_arr.length; i++){
      let swimmer = rpi_arr[i];
      if(swimmer[event] > 0 && swimmer['num_events'] < 2){
        if(swimmer[event] < testLineup_obj[event]['rpi2'] && i != testLineup_obj[event]['name1']){
          if(testLineup_obj[event]['name2'] != -1){
            rpi_arr[testLineup_obj[event]['name2']]['num_events'] -= 1;
          }
          rpi_arr[i]['num_events'] += 1;
          testLineup_obj[event]['rpi2'] = swimmer[event];
          testLineup_obj[event]['name2'] = i;
        }
      }
    }
    for(let i=0; i<rpi_arr.length; i++){
      let swimmer = rpi_arr[i];
      if(swimmer[event] > 0 && swimmer['num_events'] < 2){
        if(swimmer[event] < testLineup_obj[event]['rpi3'] && i != testLineup_obj[event]['name1'] && i != testLineup_obj[event]['name2']){
          if(testLineup_obj[event]['name3'] != -1){
            rpi_arr[testLineup_obj[event]['name3']]['num_events'] -= 1;
          }
          rpi_arr[i]['num_events'] += 1;
          testLineup_obj[event]['rpi3'] = swimmer[event];
          testLineup_obj[event]['name3'] = i;
        }
      }
    }
  });
  //calculate total rpis
  let overall_total = 0;
  num_lineups++;
  Object.keys(testLineup_obj).forEach(function(key){
    testLineup_obj[key]['total_rpi'] = testLineup_obj[key]['rpi1'] + testLineup_obj[key]['rpi2'] + testLineup_obj[key]['rpi3'];
    overall_total += testLineup_obj[key]['total_rpi'];
  });
  testLineup_obj['total_rpi'] = overall_total;
  if(bestLineup_obj == null || testLineup_obj['total_rpi'] < bestLineup_obj['total_rpi']){
    bestLineup_obj = {};
    bestLineup_obj = JSON.parse(JSON.stringify(testLineup_obj));
    num_best_lineup = num_lineups;
    //console.log("rpi: "+overall_total);
    //console.log(order);
  }
}

function generateInitialLineup(){
  lineup_obj = {};
  Object.keys(record_obj).forEach(function(key){
    lineup_obj[key] = {
      'rpi1': 99999,
      'rpi2': 99999,
      'rpi3': 99999,
      'name1': '',
      'name2': '',
      'name3': ''
    }; 
  });
  // find all #1 spots
  rpi_arr.forEach(function(e){
    Object.keys(e).forEach(function(key){
      if( key != 'name' && e[key] != 0){
        if( e[key] < lineup_obj[key]['rpi1'] ){
          lineup_obj[key]['rpi1'] = e[key];
          lineup_obj[key]['name1'] = e['name'];
        }
      }
    });
  });
  // find all #2 spots
  rpi_arr.forEach(function(e){
    Object.keys(e).forEach(function(key){
      if( key != 'name' && e[key] != 0 && e['name'] != lineup_obj[key]['name1']){
        if( e[key] < lineup_obj[key]['rpi2'] ){
          lineup_obj[key]['rpi2'] = e[key];
          lineup_obj[key]['name2'] = e['name'];
        }
      }
    });
  });
  // find all #3 spots
  rpi_arr.forEach(function(e){
    Object.keys(e).forEach(function(key){
      if( key != 'name' && e[key] != 0 && e['name'] != lineup_obj[key]['name1'] && e['name'] != lineup_obj[key]['name2']){
        if( e[key] < lineup_obj[key]['rpi3'] ){
          lineup_obj[key]['rpi3'] = e[key];
          lineup_obj[key]['name3'] = e['name'];
        }
      }
    });
  });
  //calculate total rpis
  let overall_total = 0;
  Object.keys(lineup_obj).forEach(function(key){
    lineup_obj[key]['total_rpi'] = lineup_obj[key]['rpi1'] + lineup_obj[key]['rpi2'] + lineup_obj[key]['rpi3'];
    overall_total += lineup_obj[key]['total_rpi'];
  });
  lineup_obj['total_rpi'] = overall_total;
}

function factorialize(num) {
  if (num < 0) 
        return -1;
  else if (num == 0) 
      return 1;
  else {
      return (num * factorialize(num - 1));
  }
}

function parseTimes(swimmer){
  Object.keys(swimmer).forEach(function(key){
    if(key != 'name'){
      swimmer[key] = hmsToSeconds(swimmer[key]); // convert strings of any M:S.s to floats
    }
  });
  return swimmer;
}

function calculateRPI(swimmer,record){
  Object.keys(swimmer).forEach(function(key){
    if(key != 'name'){
      // calcualte RPI for every event in the array
      // RPI = divide swimmer time by the record time
      swimmer[key] = (swimmer[key]/record[key]);
    }
  });
  return swimmer;
}

function hmsToSeconds(str) {
    if(str == null || str.length < 1)
      return 0;
    //console.log(str);
    let dec = '0.'+str.split('.')[1];
    let whole = str.split('.')[0];
    let p = whole.split(':'), s = 0, m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }

    return s+parseFloat(dec);
}

function readCookies() {
  let storedCookies = document.cookie;
  if(storedCookies.length > 0){
    return JSON.parse(storedCookies);
  }
  return {'firstVisit':true};
}

function updateCookies(newCookies) {
  document.cookie = JSON.stringify(newCookies);
}
