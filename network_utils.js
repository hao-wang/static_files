// TODO:
// 1. tgtbox 改为 topicbox； 图搜索时终点 hardcode 为root_xx

function get_siblings(network, device) {
    var parents = network.getConnectedNodes(device, "from");

    var parent_child_list = [];
    for (parent of parents) {
        var sbl = network.getConnectedNodes(parent, "to");
        const index = sbl.indexOf(error_client);
        if (index >= 0) {
            sbl.splice(index, 1);
        }
        parent_child_list.push([parent, sbl]);
    }

    return parent_child_list;
}

var options = {
    edges:{
        arrows: {
            to: {
                enabled: true,
                imageHeight: undefined,
                imageWidth: undefined,
                scaleFactor: 1,
                src: undefined,
                type: "arrow"
            },
            middle: {
                enabled: true,
                imageHeight: undefined,
                imageWidth: undefined,
                scaleFactor: 1,
                src: undefined,
                type: "arrow"
            },
            from: {
                enabled: false,
                imageHeight: undefined,
                imageWidth: undefined,
                scaleFactor: 1,
                src: undefined,
                type: "arrow"
            }
        },
        arrowStrikethrough: true,
        chosen: true,
        color: {
            color:'#848484',
            highlight:'#848484',
            hover: '#848484',
            inherit: 'to',
            opacity:1.0
        },
        dashes: false,
        font: {
            color: '#343434',
            size: 14, // px
            face: 'arial',
            background: 'none',
            strokeWidth: 2, // px
            strokeColor: '#ffffff',
            align: 'horizontal',
            multi: false,
            vadjust: 0,
            bold: {
                color: '#343434',
                size: 14, // px
                face: 'arial',
                vadjust: 0,
                mod: 'bold'
            },
            ital: {
                color: '#343434',
                size: 14, // px
                face: 'arial',
                vadjust: 0,
                mod: 'italic',
            },
            boldital: {
                color: '#343434',
                size: 14, // px
                face: 'arial',
                vadjust: 0,
                mod: 'bold italic'
            },
            mono: {
                color: '#343434',
                size: 15, // px
                face: 'courier new',
                vadjust: 2,
                mod: ''
            }
        },
        hidden: false,
        hoverWidth: 1.5,
        label: undefined,
        labelHighlightBold: true,
        length: undefined,
        physics: true,
        scaling:{
            min: 1,
            max: 15,
            label: {
                enabled: true,
                min: 14,
                max: 30,
                maxVisible: 30,
                drawThreshold: 5
            },
            customScalingFunction: function (min,max,total,value) {
                if (max === min) {
                    return 0.5;
                }
                else {
                    var scale = 1 / (max - min);
                    return Math.max(0,(value - min)*scale);
                }
            }
        },
        selectionWidth: 1,
        selfReferenceSize: 20,
        selfReference:{
            size: 20,
            angle: Math.PI / 4,
            renderBehindTheNode: true
        },
        shadow:{
            enabled: false,
            color: 'rgba(0,0,0,0.5)',
            size:10,
            x:5,
            y:5
        },
        smooth: {
            enabled: true,
            type: "dynamic",
            roundness: 0.5
        },
        title: undefined,
        value: undefined,
        width: 1,
        widthConstraint: false
    },
    interaction:{
        dragNodes:true,
        dragView: true,
        hideEdgesOnDrag: false,
        hideEdgesOnZoom: false,
        hideNodesOnDrag: false,
        hover: false,
        hoverConnectedEdges: true,
        keyboard: {
            enabled: false,
            speed: {x: 10, y: 10, zoom: 0.02},
            bindToWindow: true
        },
        multiselect: false,
        navigationButtons: false,
        selectable: true,
        selectConnectedEdges: true,
        tooltipDelay: 300,
        zoomView: false
    },
    layout: {
        randomSeed: undefined,
        improvedLayout: true,
        clusterThreshold: 150,
        hierarchical: {
            enabled: true,
            levelSeparation: 100,
            nodeSpacing: 120,
            treeSpacing: 200,
            blockShifting: true,
            edgeMinimization: true,
            parentCentralization: true,
            direction: 'UD',        // UD, DU, LR, RL
            sortMethod: 'directed',  // hubsize, directed
            shakeTowards: 'roots'  // roots, leaves
        }
    }
};

function get_multi_path_nodes(network, current_id, end, path_nodes, path_edges) {
    if (current_id === end) {
        path_nodes.push(current_id);
    } else {
        path_nodes.push(current_id);
        var parents = network.getConnectedNodes(current_id, "from");

        if (parents.length > 1) ambiguity_nodes.push(current_id);

        for (pid of parents) {
            path_edges.push(pid + "-" + current_id);
            console.log(path_edges);
            console.log(path_nodes);
            get_multi_path_nodes(network, pid, end, path_nodes, path_edges);
        }
    }
}

function get_path_nodes(network, start, end) {
    var current_id = start;
    var path_nodes = [];
    while (current_id !== end) {
        path_nodes.push(current_id);
        current_id = network.getConnectedNodes(current_id, "from")[0];
    }
    path_nodes.push(current_id);
    return path_nodes;
}


function reset_path_color(edges, nodes, color) {
    for (edge of edges) {
        var current_edge = vis_edges.get(edge);
        current_edge.color = {
            color: color,
        };
        vis_edges.update(current_edge);
    }

    for (node of nodes) {
        var current_node = vis_nodes.get(node);
        //var current_edge = network.body.data.nodes._data.get(current_id);
        current_node.color = {
            border: color,
            background: color,
        };
        vis_nodes.update(current_node);
    }
}

function change_path_color(network, vis_nodes, start, end, color) {
    //var error_client = document.getElementById('cltbox').value;
    //var error_target = document.getElementById('tgtbox').value;
    var current_id = start;
    while (current_id !== end) {
        var current_node = vis_nodes.get(current_id);
        //var current_edge = network.body.data.nodes._data.get(current_id);
        current_node.color = {
            border: color,
            background: color,
        };
        vis_nodes.update(current_node);

        var parent_id = network.getConnectedNodes(current_id, "from")[0];
        var current_edge = vis_edges.get(parent_id+'-'+current_id);
        current_edge.color = {
           color: color,
        };
        vis_edges.update(current_edge);

        current_id = parent_id;
    }
}

function get_edges(nodes, vis_edges) {
    var edgeTypes = [];
    for (var n of nodes) {
        var eids = network.getConnectedEdges(n);
        for (var eid of eids) {
            var edge = vis_edges.get(eid);
            edgeTypes.push(edge.title);
        }
    }
    return edgeTypes;
}


