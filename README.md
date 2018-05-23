# QueryCrumbs - A search history visualization

![alt text](https://github.com/EEXCESS/c4/blob/master/QueryCrumbs/screenshot.png "QueryCrumbs")

## Intro

QueryCrumbs provides a compact and minimalist visualization of a user's recent search history. 
The history is visualized as a sequence of small graphical elements. Each graphical element represents a query together with the corresponding results retrieved from a search engine or recommender system. The graphical elements have the same color if their corresponding result sets share mutual documents. By hovering over one graphical element with the mouse cursor, all other graphical elements reveal the fraction of identical documents. By clicking on an element, the user can navigate back to a previous query in the history.

## Usage

The implementation of QueryCrumbs consists of methods for drawing the visualization `querycrumbs.js` and attributes for configuring the visualization  `querycrumbs-settings.js`. In order to integrate QueryCrumbs in your application, you only need to provide two functions that establish the communication between your application and QueryCrumbs:


* __navigateQueryCallback__: Provides a mechanism to notify your application when a user wants to navigate to a previous query. The function takes a single `query` as input argument and is expected to synchronize your application with this query.
* __storage__ (optional): Handles access to the search history of a user. `Storage` is an object, that must exhibit two function:
  * __getHistory(numItems,callback)__ The parameter `numItems` specifies the number of history items to provide and the `callback` parameter is a function, that takes the provided history items as input.
  * __setHistory(history)__ This function should store the history as provided in the parameter `history`  

  If you don't provide the `storage` parameter, QueryCrumbs will use the localStorage of the browser to keep track of the queries.

You can use QueryCrumbs in your application in the following way: Create a QueryCrumbs-object and initialize it with a DOM-element, the `navigateQueryCallback` and optionally `storage`:

```javascript
var QC = QueryCrumbs();
QC.init($("div.querycrumbs").get(0), navigateQueryCallback);
```

When your application retrieved results for a new query, you inform QueryCrumbs by simply calling

```javascript
QC.addNewQuery(query);
````
The `query` parameter is an object of the following format:  

```javascript
{
 query:"query terms", // a string with the query terms
 results:[{uri:<uri1>},{uri:<uri2>},...] // a list of the retrieved results with an identifier for each result
}
```

## Installable Demo
If you want to see the QueryCrumbs in action, take a look at the [EEXCESS Chrome extension](https://chrome.google.com/webstore/detail/eexcess/mnicfonfoiffhekefgjlaihcpnbchdbc) in the [Chrome webstore](https://chrome.google.com/webstore/).

## References
Further details are described in  
[QueryCrumbs: A Compact Visualization for Navigating the Search Query History](https://ieeexplore.ieee.org/abstract/document/8107945/)
and  
QueryCrumbs for Experts: A Compact Visual Query Support System to Facilitate Insights into Search Engine Internals (to appear)  
please cite one of the following, if you use the software:
```
@inproceedings{
  title={QueryCrumbs: A Compact Visualization for Navigating the Search Query History},
  author={Seifert, Christin and Schl{\"o}tterer, J{\"o}rg and Granitzer, Michael},
  booktitle={Information Visualisation (IV), 2017 21st International Conference},
  pages={35--44},
  year={2017},
  organization={IEEE}
}
```
```
@inproceedings{
  title={QueryCrumbs for Experts: A Compact Visual Query Support System to Facilitate Insights into Search Engine Internals},
  author={Schl{\"o}tterer, J{\"o}rg and Seifert, Christin and Granitzer, Michael},
  booktitle={Information Visualisation (IV), 2018 22nd International Conference},
  year={2018},
  organization={IEEE}
}
```
