// -----CURRENT SCHEDULE EVENTS------
var currentSchedEvents = [];

function getCurrSchedEvents() {
    return currentSchedEvents;
}
function removeCurrSchedEvent(id) {
    temp = [];
    for (var i = 0; i < currentSchedEvents.length; i++) {
        var x = currentSchedEvents[i];
        if (x.id != id) {
            temp.push(x);
        }
    }
    currentSchedEvents = temp;
    return currentSchedEvents;
};
function addCurrSchedEvent(event) {
    currentSchedEvents.push(event);
}
function clearCurrSchedEvents() {
    while (currentSchedEvents.length > 0)
        currentSchedEvents.pop();
}
function setCurrSchedEvents(events) {
    for (var i = 0; i < events.length; i++)
        currentSchedEvents[i] = events[i];
}

// -----SCHEDULE OPTIONS-----
var scheduleOptionsList = [];

function addSchedOption(pagNum, eventList) {
    var pos = pagNum - 1;
    var temp = [];
    for (var i = 0; i < eventList.length; i++)
        temp.push(eventList[i]);
    scheduleOptionsList[pos] = temp;
}
function removeSchedOption(pagNum) {
    var pos = pagNum - 1;
    scheduleOptionsList.splice(pos, 1);
}
function clearSchedOptionsList() {
    if (scheduleOptionsList != null)
        while (scheduleOptionsList.length > 0)
            scheduleOptionsList.pop();
}
function getNumberOfSchedOptions() {
    return scheduleOptionsList.length;
}
function getSchedOptionsList() {
    var temp = [];
    for (var i = 0; i < scheduleOptionsList.length; i++)
        temp.push(scheduleOptionsList[i]);
    return temp;
}

function setSchedOptionsList(list) {
    clearSchedOptionsList();
    var temp=[];
    for(var i=0;i<list.length;i++)
        scheduleOptionsList.push(list[i]);
}
