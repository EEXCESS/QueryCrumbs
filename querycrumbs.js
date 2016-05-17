/**
 * A module to add a search bar to the bottom of a page.
 *
 * @module c4/queryCrumbs
 */
define(['jquery', 'd3', 'QueryCrumbs/querycrumbs-settings'], function($, d3, QueryCrumbsConfiguration) {

    var self = {
        // The DOM element to plug in the QueryCrumbs visualization
        domElem: null,
        // The svg-element within the given DOM element
        svgContainer: null,
        // The callback to retrieve the query history (a list of queries)
        getHistoryCallback: null,
        // The callback to notify an outer component about the navigation to a previous query
        navigateQueryCallback: null,
        // A list of the HISTORY_LENGTH recent queries
        historyData: [],
        // A list of similarities of one node to its predecessor
        similarities: [],
        // The main data object for visualization. Holding queries, positional information and similarities. This is what we need to redraw when new queries are issued.
        visualData: {},
        // alsd
        crumbs: [],
        // Reference to the currently selected query node
        currentNode: null,
        currentIdx: 0,
        // Temporarily stores the result documents which are identical to those of the currently hovered node.
        simResults: [],
        // The dimension of the svg panel
        width: QueryCrumbsConfiguration.dimensions.HISTORY_LENGTH * (QueryCrumbsConfiguration.dimensions.rectWidth + QueryCrumbsConfiguration.dimensions.edgeWidth) + 2 * QueryCrumbsConfiguration.dimensions.circle_cxy, // - QueryCrumbsConfiguration.dimensions.edgeWidth + 5,
        height: QueryCrumbsConfiguration.dimensions.circle_r * 2 + QueryCrumbsConfiguration.dimensions.rectInfoVertPadding + QueryCrumbsConfiguration.dimensions.rectInfoFontSize + 3,
        INTERACTION: {
            onClick: function(d, i) {
                self.currentNode = d;
                self.currentIdx = d.rID;
                d3.select(this.parentNode).selectAll(".queryCircleBorder").attr("stroke-width", 1);
                d3.select(this).select(".queryCircleBorder").attr("stroke-width", 3);
                var query;

                for (var n = 0; n < self.historyData.length; n++) {
                    if (self.historyData[n].queryID === d.queryID) {
                        query = self.historyData[n];
                        break;
                    }
                }
                self.setHistory({history: self.historyData, base_color: self.visualData[0].base_color, currentQueryID: query.queryID});
                query = query.query
                self.navigateQueryCallback(query);
            },
            onMouseOverNode: function(d, i) {

                var docNodeTag = (QueryCrumbsConfiguration.nodeForm === "CIRCLE") ? "path" : "rect";

                if (QueryCrumbsConfiguration.skillLevel !== "BEGINNER") {
                    self.simResults = [];
                    var rootGroup = d3.select(this.parentNode);
                    var resultIndices = self.CORE.collectIdenticalResults(d.rID);
                    for (var n = 0; n < resultIndices.length; n++) {
                        var idDocs = 0;
                        for (var ri = 0; ri < resultIndices[n].length; ri++) {
                            if (resultIndices[n][ri] != -1) {
                                idDocs += 1;
                            }
                        }
                        var queryNode = rootGroup.selectAll("g.crumb")
                                .filter(function(d, i) {
                            return (d.queryID == self.historyData[n].queryID);
                        })
                                .selectAll(docNodeTag + ".docNode").transition().duration(100).style("opacity", function(d, i) {
                            if (QueryCrumbsConfiguration.skillLevel == "INTERMEDIATE") {
                                if (i < idDocs) {
                                    return QueryCrumbsConfiguration.colorSettings.oldDocOpacity;
                                } else {
                                    return QueryCrumbsConfiguration.colorSettings.newDocOpacity;
                                }
                            } else {
                                if (resultIndices[n][i] > -1) {
                                    return QueryCrumbsConfiguration.colorSettings.oldDocOpacity;
                                } else {
                                    return QueryCrumbsConfiguration.colorSettings.newDocOpacity;
                                }
                            }
                        });
                        self.simResults.push(queryNode);
                    }
                }
                d3.select(this).select(".queryCircleBorder").transition().delay(0).duration(500).ease("elastic").attr("opacity", 1).attr("r", QueryCrumbsConfiguration.dimensions.circle_r).attr("stroke", "#1d904e");

                self.svgContainer.selectAll("g.crumb").filter(function(d, i) {
                    return d.queryID != self.currentNode.queryID;
                }).selectAll("g.infoBoxNode").remove();
                self.svgContainer.selectAll("g.crumb").filter(function(dl, i) {
                    return (dl.queryID == self.currentNode.queryID) && (d.queryID != dl.queryID);
                }).selectAll("g.infoBoxNode").style("visibility", "hidden");
                if (d3.select(this).select("g.infoBoxNode").empty()) {
                    self.INTERACTION.addInfoBox(this, d);
                }
            },
            onMouseOutNode: function(d, i) {
                var docNodeTag = (QueryCrumbsConfiguration.nodeForm === "CIRCLE") ? "path" : "rect";
                d3.select(this).select(".queryCircleBorder").transition().duration(200).attr("stroke", "#cccccc");
                d3.select(this.parentNode).selectAll(".docNode").transition().delay(0).duration(300).style("opacity", QueryCrumbsConfiguration.colorSettings.newDocOpacity);
                self.svgContainer.selectAll("g.crumb").filter(function(d, i) {
                    return d.queryID != self.currentNode.queryID;
                }).selectAll("g.infoBoxNode").remove();
                self.svgContainer.selectAll("g.crumb").filter(function(d, i) {
                    return d.queryID == self.currentNode.queryID;
                }).selectAll("g.infoBoxNode").style("visibility", "visible");
            },
            addInfoBox: function(hoveredNode, nodeData) {
                var infoBox = d3.select(hoveredNode).append("g").attr("class", "infoBoxNode");
                infoBox.append("text").attr("class", "textNode")
                        .text(nodeData.query)
                        .attr("text-anchor", "start")
                        .style("font-size", QueryCrumbsConfiguration.dimensions.rectInfoFontSize + "px")
                        .style("font-family", "Verdana")
                        .style("color", "#bbbbbb");

                var jqNode = $("g text.textNode");
                var w = jqNode.width();
                var h = jqNode.height();
                if (QueryCrumbsConfiguration.nodeForm == "CIRCLE") {
                    var cx = d3.select(hoveredNode).select("circle.queryCircleBorder").attr("cx");
                    //var ttX = nodeData.xpos - (w / 2) + 1;
                    var ttX = cx - (w / 2) + 1;
                    var ys = nodeData.ypos - QueryCrumbsConfiguration.dimensions.circle_r - QueryCrumbsConfiguration.dimensions.rectInfoVertPadding;
                } else {
                    var ttX = nodeData.xpos + QueryCrumbsConfiguration.dimensions.rectWidth / 2 - (w / 2) + 1;
                    var ys = nodeData.ypos - QueryCrumbsConfiguration.dimensions.rectInfoVertPadding;
                }
                if (ttX + w > self.width) {
                    ttX -= (ttX + w) - self.width;
                }
                if (ttX < 0) {
                    ttX = 0;
                }
                infoBox.select("text").attr("x", ttX).attr("y", ys);
            }
        },
        /*
         There are two ways for the QueryCrumbs visualization to obtain data. One is to load the user's query history
         from the IndexedDB. This is what we do initially when QueryCrumbs are generated. The second one is to listen to
         queries that are issued from the EEXCESS extension.
         */
        QUERYING: {
            loadDataFromIndexedDB: function() {
                EEXCESS.storage.loadQueryCrumbsData(QueryCrumbsConfiguration.dimensions.HISTORY_LENGTH, init);
            },
            loadHistory: function() {
                var history = getHistoryCallback(QueryCrumbsConfiguration.dimensions.HISTORY_LENGTH);
                if (typeof history === "undefined") {
                    history = [];
                    console.log("Query history could not be loaded.");
                }
                return history;
            }
        },
        /*
         The CORE component contains any methods related to transforming the input data into a data object that can be visualized
         directly with D3.
         */
        CORE: {
            generateVisualNode: function(query) {
                var vNode = {};
                vNode.query = query.query;
                vNode.queryID = query.queryID;
                vNode.rID = null;
                vNode.xpos = null;//QueryCrumbsConfiguration.dimensions.circle_cxy + nodeIdx * (QueryCrumbsConfiguration.dimensions.circle_r*2 + QueryCrumbsConfiguration.dimensions.edgeWidth);
                vNode.ypos = null;//QueryCrumbsConfiguration.dimensions.circle_cxy;
                vNode.sim = null;//similarities[nodeIdx].rsSimScore.sim;
                vNode.base_color = null;//(visualDataNodes[nodeIdx - 1]) ? BaseColorManager.getColor(visualDataNodes[nodeIdx - 1].base_color, vNode.sim) : BaseColorManager.getFirstColor();
                vNode.fShowEnterTransition = true;
                vNode.results = [];
                for (var docIdx = 0; docIdx < query.results.length; docIdx++) {
                    var vDoc = {};
                    vDoc.index = docIdx;
                    vDoc.uri = query.results[docIdx];
                    vNode.results.push(vDoc);
                }
                //console.log(vNode);
                return vNode;
            },
            /**
             * VisualData is a sequence of QueryCrumb-Dataobject to be rendered as-is. Each of these dataobjects should provide all information required to directly draw the object.
             * Therefore, we need to assign a relative index to each node. From this index we can compute the x-position of each node. If nodes already have a relative index, they have already been drawn previously.
             * If the relative index does not confine to the index of the dataobject in visualData, this means that preceding dataobjects have been deleted from visualData.
             * Thus, we need to reset the index to conform to the first position in the visualData-array, which requires the rendering-step to shift the graphical element of this dataobject to the left.
             * If there is no relative index set, this means the dataobject is new and has not yet been drawn. Again, we simply assign it the position in the visualData-array.
             * @param visualData
             */
            updateVisualData: function(visualData) {
                //console.log('hilde');
                //console.log(visualData);
                var newNodes = [];
                var nodeGroups = {};

                for (var nodeIdx = 0; nodeIdx < visualData.length; nodeIdx++) {
                    var old_rID = visualData[nodeIdx].rID;
                    visualData[nodeIdx].rID = nodeIdx;
                    if (QueryCrumbsConfiguration.nodeForm == "CIRCLE") {
                        visualData[nodeIdx].xpos = QueryCrumbsConfiguration.dimensions.circle_cxy + nodeIdx * (QueryCrumbsConfiguration.dimensions.circle_r * 2 + QueryCrumbsConfiguration.dimensions.edgeWidth);
                        visualData[nodeIdx].ypos = QueryCrumbsConfiguration.dimensions.circle_cxy;
                    } else {
                        visualData[nodeIdx].xpos = QueryCrumbsConfiguration.dimensions.circle_cxy - QueryCrumbsConfiguration.dimensions.rectWidth / 2 + nodeIdx * (QueryCrumbsConfiguration.dimensions.rectWidth + QueryCrumbsConfiguration.dimensions.edgeWidth);
                        visualData[nodeIdx].ypos = QueryCrumbsConfiguration.dimensions.circle_cxy - QueryCrumbsConfiguration.dimensions.rectHeight / 2;
                    }
                    // Node already existed: Update index, indicate shifting to rendering-process and remember its group

                    if (old_rID !== null) {
                        if (old_rID > nodeIdx) {
                            visualData[nodeIdx].shift = true;
                        } else {
                            visualData[nodeIdx].shift = false;
                        }
                        if (nodeGroups.hasOwnProperty(visualData[nodeIdx].base_color)) { // remove? (seems redundant)
                            nodeGroups[visualData[nodeIdx].base_color].push(visualData[nodeIdx]);
                        } else {
                            nodeGroups[visualData[nodeIdx].base_color] = [visualData[nodeIdx]];
                        }
                        // Node is new: We need to compute its similarity to previous node groups and its color. Therefore, remember the new nodes.
                    } else {
                        newNodes.push(visualData[nodeIdx]);
                    }
                }
                for (var nodeIdx = 0; nodeIdx < newNodes.length; nodeIdx++) {
                    var newNode = newNodes[nodeIdx];
                    var similarities = self.CORE.getGroupSimilarities(newNode, nodeGroups);
                    newNode.sim = similarities.maxMutualResults / newNode.results.length;
                    if (newNode.rID == 0) {
                        if (self.base_color == undefined) {
                            newNode.base_color = QueryCrumbsConfiguration.BaseColorManager.getInitialColor();
                        } else {
                            newNode.base_color = self.base_color;
                        }
                    } else {
                        if (newNode.sim > QueryCrumbsConfiguration.colorSettings.colorThreshold) {
                            newNode.base_color = similarities.maxMutualResultsBaseColor;
                        } else {
                            newNode.base_color = QueryCrumbsConfiguration.BaseColorManager.getNextColor(visualData[newNode.rID - 1].base_color);
                        }
                    }
                    if (nodeGroups.hasOwnProperty(newNode.base_color)) {
                        nodeGroups[newNode.base_color].push(newNode);
                    } else {
                        nodeGroups[newNode.base_color] = [newNode];
                    }
                }
                return visualData;
            },
            getGroupSimilarities: function(node, nodeGroups) {
                var maxMutualResults = 0;
                var maxMutualResultsBaseColor = null;
                var maxRelativeIndex = 0;
                var similarities = {
                    maxMutualResults: 0,
                    maxMutualResultsBaseColor: null,
                    groupSimilarities: {}
                };
                for (var base_color in nodeGroups) {
                    var groupResults = [];
                    var groupMaxRelativeIndex = 0;
                    if (nodeGroups.hasOwnProperty(base_color)) {
                        for (var groupElemIdx = 0; groupElemIdx < nodeGroups[base_color].length; groupElemIdx++) {
                            groupResults = groupResults.concat(nodeGroups[base_color][groupElemIdx].results);
                            groupMaxRelativeIndex = nodeGroups[base_color][groupElemIdx].rID;
                        }
                    }
                    var mutualResults = self.CORE.intersect(node.results, groupResults);
                    if (mutualResults.length > maxMutualResults) {
                        maxMutualResults = mutualResults.length;
                        maxMutualResultsBaseColor = base_color;
                        maxRelativeIndex = groupMaxRelativeIndex;
                    } else if (mutualResults.length == maxMutualResults) {
                        if (groupMaxRelativeIndex > maxRelativeIndex) {
                            maxMutualResultsBaseColor = base_color;
                            maxRelativeIndex = groupMaxRelativeIndex;
                        }
                    }
                    similarities.groupSimilarities[base_color] = {};
                    similarities.groupSimilarities[base_color]['groupMutualResults'] = mutualResults.length;
                    similarities.groupSimilarities[base_color]['groupTotalResults'] = groupResults.length;
                }
                similarities.maxMutualResults = maxMutualResults;
                similarities.maxMutualResultsBaseColor = maxMutualResultsBaseColor;
                return similarities;
            },
            intersect: function(set1, set2) {
                //console.log('uriuri');
                //console.log(set1);
                //console.log(set2);
                var mutualResults = [];
                for (var r1 = 0; r1 < set1.length; r1++) {
                    for (var r2 = 0; r2 < set2.length; r2++) {
                        if (set1[r1].uri.uri === set2[r2].uri.uri) {
                            mutualResults.push(set1[r1]);
                            break;
                        }
                    }
                }
                return mutualResults;
            },
            collectIdenticalResults: function(refQueryIdx) {
                console.log(refQueryIdx)
                var sims = [];
                for (var qi = 0; qi < self.historyData.length; qi++) {
                    var querySims = [];
                    for (var ri = 0; ri < self.historyData[qi].results.length; ri++) {
                        var foundIdx = -1;
                        for (var rri = 0; rri < self.historyData[refQueryIdx].results.length; rri++) {
                            if (self.historyData[qi].results[ri].uri == self.historyData[refQueryIdx].results[rri].uri) {
                                foundIdx = rri;
                            }
                        }
                        querySims.push(foundIdx);
                    }
                    sims.push(querySims);
                }
                //console.log(sims);
                return sims;
            },
//            getQueryTerms: function(query) {
//                var queryTerms = [];
//                for (var i = 0; i < query.profile.contextKeywords.length; i++) {
//                    queryTerms.push(query.profile.contextKeywords[i].text);
//                }
//                return queryTerms;
//            },
            addVisualNode: function(query) {
                self.historyData.push(query);
                self.currentIdx = self.historyData.length - 1;
                self.currentNode = self.historyData[self.currentIdx];
                self.visualData.push(self.CORE.generateVisualNode(query));
                self.visualData = self.CORE.updateVisualData(self.visualData);
            }
        },
        RENDERING: {
            addCrumb: function(d) {

                if (QueryCrumbsConfiguration.nodeForm == "CIRCLE") {
                    var xpos = QueryCrumbsConfiguration.dimensions.circle_cxy + d.rID * (QueryCrumbsConfiguration.dimensions.circle_r * 2 + QueryCrumbsConfiguration.dimensions.edgeWidth);
                    var ypos = QueryCrumbsConfiguration.dimensions.circle_cxy;
                    var r = 5;
                    var scaleBy = ((QueryCrumbsConfiguration.dimensions.circle_r - 2) / r);

                    var crumbBoundary = d3.select(this).append("circle").attr({
                        class: "queryCircleBorder",
                        cx: xpos,
                        cy: ypos,
                        r: r,
                        opacity: 0,
                        fill: "white",
                        stroke: "#cccccc"
                    });
                    if (d.fShowEnterTransition) {
                        crumbBoundary.transition().delay(0).duration(500).ease("elastic").attr("opacity", 1).attr("r", QueryCrumbsConfiguration.dimensions.circle_r);
                    } else {
                        crumbBoundary.attr("opacity", 1).attr("r", QueryCrumbsConfiguration.dimensions.circle_r);
                    }

                    var contentGroup = d3.select(this).append("g").attr("class", "queryCircleContent").attr("opacity", 0);
                    contentGroup.append("circle").attr({
                        class: "queryCircleBg",
                        cx: xpos,
                        cy: ypos,
                        r: r,
                        fill: d.base_color
                    });

                    var docGroup = contentGroup.append("g").attr("transform", "translate(" + xpos + ", " + ypos + ")");
                    var docNodes = docGroup.selectAll("path.docNode").data(function(d) {
                        return d.results;
                    });
                    var segments = d.results.length;
                    var arc = d3.svg.arc()
                            .innerRadius(0)
                            .outerRadius(r)
                            .startAngle(function(d) {
                        return ((360 / segments) * (Math.PI / 180)) * d.index;
                    })
                            .endAngle(function(d) {
                        return ((360 / segments) * (Math.PI / 180)) * (d.index + 1);
                    });

                    docNodes.enter().append("path").attr("d", arc);
                    docNodes.attr("class", "docNode")
                            .attr("d", arc)
                            //.style("opacity", function(d) { return ((d.preIdx == -1) ? QueryCrumbsConfiguration.colorSettings.newDocOpacity : QueryCrumbsConfiguration.colorSettings.oldDocOpacity);});
                            .style("opacity", QueryCrumbsConfiguration.colorSettings.newDocOpacity);
                    if (d.fShowEnterTransition) {
                        contentGroup.transition().delay(100).duration(500).ease("elastic").attr("opacity", 1).attr("transform", "translate(-" + xpos * (scaleBy - 1) + ",-" + ypos * (scaleBy - 1) + ")scale(" + scaleBy + ")");
                    } else {
                        contentGroup.attr("opacity", 1).attr("transform", "translate(-" + xpos * (scaleBy - 1) + ",-" + ypos * (scaleBy - 1) + ")scale(" + scaleBy + ")");
                    }
                    d.fShowEnterTransition = true;
                } else {
                    var xpos = QueryCrumbsConfiguration.dimensions.circle_cxy - QueryCrumbsConfiguration.dimensions.rectWidth / 2 + d.rID * (QueryCrumbsConfiguration.dimensions.rectWidth + QueryCrumbsConfiguration.dimensions.edgeWidth);
                    var ypos = QueryCrumbsConfiguration.dimensions.circle_cxy - QueryCrumbsConfiguration.dimensions.rectHeight / 2;

                    var crumbBoundary = d3.select(this).append("rect").attr("transform", "translate(50,0)").attr({
                        class: "queryCircleBorder",
                        x: xpos,
                        y: ypos,
                        width: QueryCrumbsConfiguration.dimensions.rectWidth,
                        height: QueryCrumbsConfiguration.dimensions.rectHeight,
                        opacity: 0,
                        fill: "white",
                        stroke: "#cccccc"
                    });
                    crumbBoundary.transition().delay(100).duration(500).ease("elastic").attr("opacity", 1).attr("transform", "translate(0,0)");//.attr("width", QueryCrumbsConfiguration.dimensions.rectWidth).attr("height", QueryCrumbsConfiguration.dimensions.rectHeight);

                    var contentGroup = d3.select(this).append("g").attr("class", "queryCircleContent").attr("transform", "translate(50,0)").attr("opacity", 0);
                    contentGroup.append("rect").attr({
                        class: "queryCircleBg",
                        x: xpos + 2,
                        y: ypos + 2,
                        width: QueryCrumbsConfiguration.dimensions.rectWidth - 4,
                        height: QueryCrumbsConfiguration.dimensions.rectHeight - 4,
                        fill: d.base_color
                    });

                    var docGroup = contentGroup.append("g");
                    var docNodes = docGroup.selectAll("rect.docNode").data(function(d) {
                        return d.results.slice(0, QueryCrumbsConfiguration.dimensions.docRectHorizontal * QueryCrumbsConfiguration.dimensions.docRectVertical);
                    });

                    var docWidth = (QueryCrumbsConfiguration.dimensions.rectWidth - 4) / QueryCrumbsConfiguration.dimensions.docRectHorizontal;
                    var docHeight = (QueryCrumbsConfiguration.dimensions.rectHeight - 4) / QueryCrumbsConfiguration.dimensions.docRectVertical;

                    docNodes.enter().append("rect");
                    docNodes.attr("class", "docNode")
                            .attr("x", function(d, i) {
                        return xpos + 2 + (i % QueryCrumbsConfiguration.dimensions.docRectHorizontal) * docWidth;
                    })
                            .attr("y", function(d, i) {
                        return ypos + 2 + Math.floor(i / QueryCrumbsConfiguration.dimensions.docRectHorizontal) * docHeight;
                    })
                            .attr("width", docWidth)
                            .attr("height", docHeight)
                            //.style("opacity", function(d) { return ((d.preIdx == -1) ? QueryCrumbsConfiguration.colorSettings.newDocOpacity : QueryCrumbsConfiguration.colorSettings.oldDocOpacity);});
                            .style("opacity", QueryCrumbsConfiguration.colorSettings.newDocOpacity);

                    contentGroup.transition().delay(100).duration(500).ease("elastic").attr("opacity", 1).attr("transform", "translate(0,0)");//.attr("transform", "translate(-" + xpos * (XscaleBy - 1) + ",-" + ypos * (YscaleBy - 1) + ")scale(" + XscaleBy + ","+YscaleBy+")");

                }
            },
            redraw: function(visualData) {

                var crumbs = self.svgContainer.selectAll("g.crumb").data(visualData, function(d) {
                    return d.queryID;
                });

                crumbs.exit().attr("opacity", 1).transition().duration(500).delay(function(d, i) {
                    return i * 50;
                }).ease("elastic").attr("opacity", 0)
                        .attr("transform", function(d, i) {
                    if (d.rID == 0) {
                        return "translate(-100, 0)";
                    } else {
                        return "translate(0,100)";
                    }
                }).each("end", function() {
                    this.remove();
                });

                crumbs.transition().duration(500).ease("elastic").attr("transform", function(d, i) {
                    var currentx = d3.transform(d3.select(this).attr("transform")).translate[0];
                    var currenty = d3.transform(d3.select(this).attr("transform")).translate[1];
                    if (d.shift) {
                        var newX;
                        if (QueryCrumbsConfiguration.nodeForm == "CIRCLE") {
                            newX = currentx - (QueryCrumbsConfiguration.dimensions.circle_r * 2 + QueryCrumbsConfiguration.dimensions.edgeWidth);
                        } else {
                            newX = currentx - (QueryCrumbsConfiguration.dimensions.rectWidth + QueryCrumbsConfiguration.dimensions.edgeWidth);
                        }
                        return "translate(" + newX + ", " + currenty + ")";
                    } else {
                        return "translate(" + currentx + "," + currenty + ")";
                    }
                });



                crumbs.enter().append("g").attr("class", "crumb")
                        .on("mouseenter", self.INTERACTION.onMouseOverNode)
                        .on("mouseleave", self.INTERACTION.onMouseOutNode)
                        .on("click", self.INTERACTION.onClick)
                        .each(self.RENDERING.addCrumb);
            },
            setCurrentQuery: function(queryID) {
                self.svgContainer.selectAll(".crumb").filter(function(d) {
                    return (d.queryID === queryID);
                }).each(function(d, i) {
                    self.currentNode = d;
                    self.currentIdx = d.rID;
                    d3.select(this.parentNode).selectAll(".queryCircleBorder").attr("stroke-width", 1);
                    d3.select(this).select(".queryCircleBorder").attr("stroke-width", 3);
                    self.svgContainer.selectAll("g.infoBoxNode").remove();
                    self.INTERACTION.addInfoBox(this, d);
                })
            }
        }
    };
    return {
        /**
         * Method to initialize the QueryCrumbs-visualization.
         * @param domElement    The DOM-node where the visualization should reside in.
         * @param navigateQueryCallback     A callback function, indicating that a user wants to navigate to a previous query.
         * The function has one parameter {@param query} and is called whenever the user selects a query-node.
         * @param [storage]  An object, providing storage capabilities for the queryCrumbs history. Must exhibit two functions: getHistory(callback(history)) and setHistory(history). getHistory provides the history and callback(history) should be called with the provided history elements. setHistory should store the provided history. If the storage parameter is not provided, QueryCrumbs will use the browser's local Storage to handle the history.
         */
        init: function(domElement, navigateQueryCallback, storage) {

            d3.selection.prototype.last = function() {
                var last = this.size() - 1;
                return d3.select(this[0][last]);
            };
            QueryCrumbsConfiguration.dimensions.circle_cxy = QueryCrumbsConfiguration.dimensions.circle_r + QueryCrumbsConfiguration.dimensions.rectInfoVertPadding + QueryCrumbsConfiguration.dimensions.rectInfoFontSize;
            if (QueryCrumbsConfiguration.nodeForm == "CIRCLE") {
                self.width = QueryCrumbsConfiguration.dimensions.HISTORY_LENGTH * (QueryCrumbsConfiguration.dimensions.circle_r * 2 + QueryCrumbsConfiguration.dimensions.edgeWidth) + 2 * QueryCrumbsConfiguration.dimensions.circle_cxy;
            } else {
                self.width = QueryCrumbsConfiguration.dimensions.HISTORY_LENGTH * (QueryCrumbsConfiguration.dimensions.rectWidth + QueryCrumbsConfiguration.dimensions.edgeWidth) + 2 * QueryCrumbsConfiguration.dimensions.circle_cxy;
            }
            self.domElem = d3.select(domElement);
            if (storage) {
                self.getHistoryCallback = storage.getHistory;
                self.setHistory = storage.setHistory;
            } else {
                if (typeof(window.localStorage) !== "undefined") {
                    self.setHistory = function(histItem) {
                        window.localStorage.setItem("QueryCrumbs", JSON.stringify(histItem));
                    };
                }
                self.getHistoryCallback = function(callback) {
                    if (typeof(window.localStorage) !== "undefined") {
                        var qc = JSON.parse(window.localStorage.getItem("QueryCrumbs"));
                        callback(qc);
                    }
                };
            }
            self.navigateQueryCallback = navigateQueryCallback;
            self.svgContainer = self.domElem.append("svg")
                    .attr("width", self.width)
                    .attr("height", self.height)
                    .attr("class", "queryCrumbs-svg");

            self.getHistoryCallback(function(loadedHistory) {
                if (typeof loadedHistory === 'undefined' || loadedHistory === null) {
                    loadedHistory = {
                        history: [],
                        base_color: QueryCrumbsConfiguration.BaseColorManager.getInitialColor(),
                        currentQueryID: -1
                    };
                }
                self.base_color = loadedHistory.base_color;
                var currentQueryID = loadedHistory.currentQueryID;
                var hist = loadedHistory.history.slice(Math.max(loadedHistory.history.length - QueryCrumbsConfiguration.dimensions.HISTORY_LENGTH, 0));
                self.visualData = [];
                for (var nodeIdx = 0; nodeIdx < hist.length; nodeIdx++) {
                    self.CORE.addVisualNode(hist[nodeIdx]);
                }
                self.RENDERING.redraw(self.visualData);
                self.RENDERING.setCurrentQuery(currentQueryID);
            });
        },
        /**
         * Refresh the visualization from the status stored in storage.
         */
        refresh: function() {
            self.svgContainer.selectAll(".crumb").remove();
            self.getHistoryCallback(function(loadedHistory) {
                if (typeof loadedHistory === 'undefined' || loadedHistory === null) {
                    loadedHistory = {
                        history: [],
                        base_color: QueryCrumbsConfiguration.BaseColorManager.getInitialColor(),
                        currentQueryID: -1
                    };
                }
                self.base_color = loadedHistory.base_color;
                var currentQueryID = loadedHistory.currentQueryID;
                var hist = loadedHistory.history.slice(Math.max(loadedHistory.history.length - QueryCrumbsConfiguration.dimensions.HISTORY_LENGTH, 0));
                self.visualData = [];
                for (var nodeIdx = 0; nodeIdx < hist.length; nodeIdx++) {
                    self.CORE.addVisualNode(hist[nodeIdx]);
                }
                self.RENDERING.redraw(self.visualData);
                self.RENDERING.setCurrentQuery(currentQueryID);
            });
        },
        /**
         * Add a new query to the query history. In the QueryCrumbs-visualization, a new query-node will be drawn
         * to the right of the current query-node. If the number of visible query-nodes exceeds {@param QueryCrumbsConfiguration.dimensions.HISTORY_LENGTH},
         * the oldest query-node (leftmost) will be removed from the history. The {@param QueryCrumbsConfiguration.dimensions.HISTORY_LENGTH} most recent queries
         * will be stored in the local storage of the browser.
         * @param query An object that contains query terms and corresponding search results.
         * The format must comply with the format returned by the Privacy Proxy {@link https://github.com/EEXCESS/eexcess/wiki/%5B21.09.2015%5D-Request-and-Response-format#pp-response-format}.
         */
        addNewQuery: function(query) {
            query.queryID = new Date().getTime();
            self.historyData.splice(self.currentIdx + 1, self.historyData.length);
            self.visualData.splice(self.currentIdx + 1, self.visualData.length);
            self.CORE.addVisualNode(query);
            if (self.historyData.length > QueryCrumbsConfiguration.dimensions.HISTORY_LENGTH) {
                self.historyData.splice(0, 1);
                self.currentIdx = self.historyData.length - 1;
                self.currentNode = self.historyData[self.currentIdx];
                self.visualData.splice(0, 1);
                self.visualData = self.CORE.updateVisualData(self.visualData);
            }
            self.RENDERING.redraw(self.visualData);
            self.svgContainer.selectAll(".crumb").last().each(function(d, i) {
                self.currentNode = d;
                self.currentIdx = d.rID;
                d3.select(this.parentNode).selectAll(".queryCircleBorder").attr("stroke-width", 1);
                d3.select(this).select(".queryCircleBorder").attr("stroke-width", 3);
                self.svgContainer.selectAll("g.infoBoxNode").remove();
                self.INTERACTION.addInfoBox(this, d);
            });
            //console.log(self.historyData);
            self.setHistory({history: self.historyData, base_color: self.visualData[0].base_color, currentQueryID: self.historyData[self.currentIdx].queryID});
        },
        getLastCrumb: function(){
            return (self.historyData.length > 0) ? self.historyData[self.historyData.length-1].query: '';
        }
    }
});