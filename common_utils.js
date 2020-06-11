// Page redirects
function redirect_add_fix() {
    window.open('/admin/expert_app/devicefix', '_self');
}

function redirect_back_home() {
    window.open('/', '_self');
}

function redirect_open_topic(url_base, topic) {
    var new_url = url_base.replace('12345', topic);
    window.open(new_url, '_self');
}

function redirect_write_report(data) {
    window.open('/admin/expert_app/report/', '_self');
}

// Questionnaire manipulation
function get_selected(sid) {
    var v = document.getElementById(sid).value;
    if (sid === "cltbox") {
        error_client = v;
        error_interval[0] = v;
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

function new_question(current_object, ancestor, question, mode="loop") {
    var newQ;
    if (mode === "loop") {
        newQ = document.createElement('div');
        newQ.class = "checkbox";
        newQ.name = "question_" + current_object;
        var str_q;
        if (question[1].length > 0) {
            str_q = `${question[0]}: ${question[1]}`
        } else {
            str_q = `${question[0]}: 是否工作正常？`
        }
        newQ.innerHTML = `<li>${str_q}<br>
            <label for="chkYes">
                <input type="radio" id="chkYes" name="chkPassPort"
                   onclick="inference('${current_object}', '${question[0]}', '${ancestor}', 'yes');
                            visual_inference('${question[0]}', '${error_target}', 'green')"/>
            Yes </label>
            <label for="chkNo">
                <input type="radio" id="chkNo" name="chkPassPort"
                    onclick="inference('${current_object}', '${question[0]}', '${ancestor}', 'no');
                             visual_inference('${question[0]}', '${ancestor}', 'red')"/>
            No </label>
            </li>`;
    } else {
        newQ = document.createElement('div');
        newQ.innerHTML = `<li>上述问题都回答不了<br>
                <label>
                    <input type="radio"
                        onclick="inference('${current_object}', '${question[0]}', '${ancestor}', 'unknown');
                                 visual_inference('${question[0]}', '${ancestor}', 'yellow')">
                </label></li>`;
    }

    return newQ;
}

function new_fix(obj, fix, mode="loop") {
    var newF;
    if (mode === "loop") {
        newF = document.createElement('div');
        newF.innerHTML = `<li> ${obj}: ${fix}
            <button type="button" onclick="redirect_back_home()"> <span>It works!</span></button>
                            </li>`;
    } else {
        newF = document.createElement('div');
        newF.innerHTML = `
            <li> 上面这些都不管用。但我解决了问题
            <button type="button" onclick="redirect_add_fix()"> <span>增加解决方案</span></button>
            </li>
            <li> 问题最终也没解决
            <button type="button" onclick="redirect_write_report('ha')"> <span>记录未解问题</span></button>
            </li>`;
    }
    return newF;
}

function get_check_methods(siblings, check_dict) {
    var n;
    var methods = [];
    for (n of siblings) {
        if (n in check_dict) {
            methods.push(...check_dict[n]);
        }
    }
    methods.sort(function(a, b) {
        return a[a.length-3] - b[b.length-3];
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
            newF = new_fix(m[0], m[1], mode="loop");
            document.getElementById("questionBox").appendChild(newF);
        }
    }

    newF = new_fix(m[0], m[1], mode="end");
    document.getElementById("questionBox").appendChild(newF);
}

function showQuestions(network, obj, vis_edges) {
    var parent_child_list = get_siblings(network, obj);
    if (parent_child_list.length > 1) {
        for (pch of parent_child_list) {
            var x = document.createElement('input');
            //x.setAttribute("type", "checkbox");
            x.type = "checkbox";
            x.id = "id";
            var edge_desc = vis_edges.get(pch[0]+"_"+obj);
            // creating label for checkbox
            var label = document.createElement('label');
            label.htmlFor = "id";
            label.appendChild(document.createTextNode(edge_desc));
            document.getElementById("questionBox").appendChild(x);
            document.getElementById("questionBox").appendChild(label);
        }
    }

    for ([ancestor, sbls] of parent_child_list) {
        if (sbls.length > 0) {
            var questions = get_check_methods(sbls, check_dict);
            for (var q of questions) {
                console.log(q);
                var newQ = new_question(obj, ancestor, q);
                document.getElementById("questionBox").appendChild(newQ);
            }

            var unk = new_question(obj, ancestor, q, mode="unk");
            document.getElementById("questionBox").appendChild(unk);
        }
    }
}

function reach_conclusion(start, end) {
    var newC = document.createElement('div');
    if (start === end) {
        newC.innerHTML = `<li>故障出现在 ${start}。</li>`;
    } else {
        newC.innerHTML = `<li>故障出现在 ${start} 和 ${end} 之间 (包括设备及接线)。</li>`;
    }

    document.getElementById('conclusionBox').appendChild(newC);
    clear_box("questionBox");
    clear_box("questionHead");
    showFixes(start, end, fix_dict, path_nodes, vis_edges);
    dive_deeper(start, end);
}

// Report generation
function generate_report(data) {
    //[topic, query, endpoint, evidence, conclusion, review] = data;
    redirect_write_report(data);
}
