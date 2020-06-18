// global variables
function get_topics(item_list, item_type, all_topics) {
    /*
    * Given an item list, return those with corresponding topics (have structures therein).
    * */
    let topic_list = [];
    for (var item of item_list) {
        let itp = item_type[item];
        for ([tpid, tp] of all_topics) {
            if (tp === itp) {
                topic_list.push([item, tp, tpid]);
            }
        }
    }

    return topic_list;
}

// Page redirects
function redirect_add_fix() {
    window.open('/admin/expert_app/devicefix');
}

function redirect_open_topic(url_base, topic) {
    var new_url = url_base.replace('12345', topic);
    window.open(new_url, '_self');
}

function redirect_write_report(result) {
    var review;
    if (result === "sys") {
        review = "已解决（系统）";
    } else if (result === "self") {
        review = "已解决（新增）";
    } else {
        review = "未解决";
    }

    var query = sessionStorage.getItem('query') || '123';
    var topic_id = sessionStorage.getItem('topic_id') || '123';
    var endpoint_id = sessionStorage.getItem('endpoint_id') || '123';
    var evidence = sessionStorage.getItem('evidence') || '123';
    var conclusion = sessionStorage.getItem('conclusion') || '123';
    var params = `query=${query}&topic=${topic_id}&endpoint=${endpoint_id}` +
        `&evidence=${evidence}&conclusion=${conclusion}&review=${review}`;

    console.log("report url paraemter: " + params);
    var url = `/admin/expert_app/report/add/?${params}`;
    window.open(url, '_self');
}

// Questionnaire manipulation
function get_selected(sid) {
    var ele = document.getElementById(sid);
    var v = ele[ele.selectedIndex].value;
    if (sid === "cltbox") {
        error_client = v;
        error_interval[0] = v;
        // If it's not in a 'dive-in' page, set endpoint.
        var nid = ele[ele.selectedIndex].id;
        if (sessionStorage.getItem('tier') === '1') {
            sessionStorage.setItem('endpoint_id', nid);
        }

    } else if (sid === "tgtbox") {
        error_target = v;
        error_interval[1] = v;
    }
    return v;
}

function clear_box(id) {
    const myNode = document.getElementById(id);
    myNode.innerHTML = "";
    while (myNode.firstChild) {
        myNode.removeChild(myNode.lastChild);
    }
}

function new_question(current_object, ancestor, question, reach_end=false) {
    var newQ;
    var str_q = "";
    let item_to_check = question[0];
    let check_method = question[1];
    let check_direction = question[2];
    if (!reach_end) {
        newQ = document.createElement('div');
        newQ.class = "checkbox";
        newQ.name = "question_" + current_object;

        if (check_direction === "upstream") {
            str_q = `${item_to_check}&rarr;${error_target}: ${check_method}`;
            newQ.innerHTML = `<li>${str_q}<br>`
                + `<label><input type="radio" onclick="inference_upstream('${current_object}', '${item_to_check}', '${ancestor}', 'yes', '${str_q}');"/> Yes </label>`
                + `<label><input type="radio" onclick="inference_upstream('${current_object}', '${item_to_check}', '${ancestor}', 'no', '${str_q}');"/> No </label>`
                + `</li>`;
        } else if (check_direction === "downstream") {
            str_q = `${error_client}&rarr;${item_to_check}: ${check_method}`;
            newQ.innerHTML = `<li>${str_q}<br>`
                + `<label><input type="radio" onclick="inference_downstream('${current_object}', '${item_to_check}', '${ancestor}', 'yes', '${str_q}');"/> Yes </label>`
                + `<label><input type="radio" onclick="inference_downstream('${current_object}', '${item_to_check}', '${ancestor}', 'no', '${str_q}');"/> No </label>`
                + `</li>`;
        } else if (check_direction === "bypass"){
            str_q = `${error_client}&rarr;<del>${item_to_check}</del>&rarr;${error_target}: ${check_method}`;
            newQ.innerHTML = `<li>${str_q}<br>`
                + `<label><input type="radio" onclick="inference_bypass('${current_object}', '${item_to_check}', '${ancestor}', 'yes', '${str_q}');"/> Yes </label>`
                + `<label><input type="radio" onclick="inference_bypass('${current_object}', '${item_to_check}', '${ancestor}', 'no', '${str_q}');"/> No </label>`
                + `</li>`;
        }
    } else {
        newQ = document.createElement('div');
        newQ.innerHTML = `<li>上述问题都回答不了<br>`
           + `<label><input type="radio" onclick="inference_upstream('${current_object}', '${item_to_check}', '${ancestor}', 'unknown', '${str_q}');"></label></li>`;
    }

    return newQ;
}

function new_fix(obj, fix, reach_end=false) {
    var newF;
    if (!reach_end) {
        newF = document.createElement('div');
        newF.innerHTML = `<li> ${obj}: ${fix} <button type="button" onclick="redirect_write_report('sys')"> <span>It works!</span></button> </li>`;
    } else {
        newF = document.createElement('div');
        newF.innerHTML = `<li> 上面这些都不管用。但我解决了问题`
            +`<button type="button" onclick="redirect_add_fix()"> <span>增加检查项/解决方案</span></button>`
            +`<button type="button" onclick="redirect_write_report('self')"> <span>生成报告</span></button>`
            +`</li>`
            +`<li> 问题最终没解决`
            +`<button type="button" onclick="redirect_write_report('none')"> <span>记录未解决问题</span></button>`
            +`</li>`;
    }
    return newF;
}

function get_check_methods(siblings, check_dict) {
    // method: (name, examine, direction, cost, prob)
    var n;
    var methods = [];
    for (n of siblings) {
        if (check_dict[n]) {
            methods.push(...check_dict[n]);
        }
    }
    methods.sort(function(a, b) {
        return a[-2] - b[-2];
    });

    return methods;
}


function get_fix_methods(nodes, fix_dict) {
    var n;
    var methods = [];
    for (n of nodes) {
        if (n in fix_dict) {
            methods.push(...fix_dict[n]);
        }
    }
    methods.sort(function(a, b) {
        return a[2] - b[2];
    });

    return methods;
}

function showFixes(start, end, fix_dict, path_nodes, vis_edges) {
    var path_node_set = new Set(path_nodes);

    var methods = get_fix_methods(path_node_set, fix_dict);

    var edgeList = get_edges(path_node_set, vis_edges);
    if (edgeList.includes('wire') === true) {
        methods.push(...fix_dict['wire']);
    }

    var newF;
    if (methods.length > 0) {
        document.getElementById("questionHead").innerText = "可尝试的解决方法（自上而下难度递增）";

        for (m of methods) {
            newF = new_fix(m[0], m[1], reach_end=false);
            document.getElementById("questionBox").appendChild(newF);
        }
    }

    newF = new_fix(m[0], m[1], reach_end=true);
    document.getElementById("questionBox").appendChild(newF);
}

function showQuestions(network, obj, vis_edges) {
    let parent_child_list = get_siblings(network, obj);
    /*
    if (parent_child_list.length > 1) {
        for (let pch of parent_child_list) {
            let x = document.createElement('input');
            //x.setAttribute("type", "checkbox");
            x.type = "checkbox";
            x.id = "id";
            let edge_desc = vis_edges.get(pch[0]+"_"+obj);
            // creating label for checkbox
            let label = document.createElement('label');
            label.htmlFor = "id";
            label.appendChild(document.createTextNode(edge_desc));
            document.getElementById("questionBox").appendChild(x);
            document.getElementById("questionBox").appendChild(label);
        }
    }
    */

    for ([ancestor, sbls] of parent_child_list) {
        if (sbls.length > 0) {
            var questions = get_check_methods(sbls, check_dict);
            console.log('obj & questions:', obj, questions);
            for (var q of questions) {
                //console.log(q);
                var newQ = new_question(obj, ancestor, q);
                document.getElementById("questionBox").appendChild(newQ);
            }
        }
    }
    var unk = new_question(obj, ancestor, q, reach_end=true);
    document.getElementById("questionBox").appendChild(unk);
}

function add_new_evidence(so_you_say, then_i_know) {
    var newE = document.createElement('div');

    newE.innerHTML = `<li>${so_you_say} ${then_i_know}`;
    document.getElementById('evidenceBox').appendChild(newE);
    sessionStorage.setItem('evidence',
        (sessionStorage.getItem('evidence') || '') + '>> ' + so_you_say + then_i_know + '%0A');
}

function reach_conclusion(start, end) {
    var newC = document.createElement('div');
    var conclusion;
    if (start === end) {
        conclusion = `故障出现在 ${start}。`;
    } else {
        conclusion = `故障出现在 ${start} 和 ${end} 之间 (包括设备及接线)。`;
    }

    sessionStorage.setItem('conclusion', conclusion);
    newC.innerHTML = `<li>${conclusion}`;

    document.getElementById('conclusionBox').appendChild(newC);
    clear_box("questionBox");
    clear_box("questionHead");
    showFixes(start, end, fix_dict, path_nodes, vis_edges);
    drill_down(start, end);
}

