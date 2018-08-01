/**
 * Created by Pedro Lanzagorta M on 12/30/2016.
 */

var tabClassesArr = [];
var currentActivePage = 1;
var numberOfPages = 1;

var isSaving = false;
const cookieName = 'savedOptions';
const SERVER_URL = 'https://horarios-itam-server.herokuapp.com';

//const SERVER_URL = 'http://localhost:8000';

$(document).ready(function () {
    setLoadingSpinner();
    getHTTPAvailableCourses();
    setTabFunctionality();
    updateCalendarSettings();
    setButtonConfig();

});
// Firebase

var listenFeedback = function(){
    alert();
}

// -----HTTP GETs-----
var getHTTPSchedulesForCourse = function (ind, courseName) {
    $.get(SERVER_URL + "/loadSchedules", {cName: courseName}, function (data, status) {
        tabClassesArr.push(data);
        loadSchedulesToPanel(ind, courseName, data);
    });

};
var getHTTPAvailableCourses = function () {
    $.get(SERVER_URL + "/loadCourses", function (data, status) {
        populateDropDown(data);
    });
};
var setLoadingSpinner = function () {
    jQuery.ajaxSetup({
        beforeSend: function () {
            $('#spinner').css('visibility', 'visible');
        },
        complete: function () {
            $('#spinner').css('visibility', 'hidden');
        },
        success: function () {
        }
    });
};

// -----GUI FUNCTIONALITY SETUP-----
var setButtonConfig = function () {
    $('#btn-clr-cal').click(function () {
        clearCurrSchedEvents();
        refreshCalendar();
    });
    $('#btn-add-sched').click(function () {
        var events = getCurrSchedEvents();
        addSchedOption(currentActivePage, events);
        numberOfPages++;
        currentActivePage++;
        $('#pagination-list').html(generatePaginationHTML(currentActivePage));
        loadSchedulesToCal(currentActivePage);
    });
    $('#btn-rmv-sched').click(function () {
        //var activePage = $('#pagination-list li.active').text();
        if (currentActivePage != 1) {
            removeSchedOption(currentActivePage);
            numberOfPages--;
            currentActivePage--;
            $('#pagination-list').html(generatePaginationHTML(currentActivePage));
            loadSchedulesToCal(currentActivePage);
        }
    });
    $('#btn-clr-ops').click(function () {
        numberOfPages = 1;
        currentActivePage = 1;
        $('#pagination-list').html(generatePaginationHTML(currentActivePage));
        clearSchedOptionsList();
        loadSchedulesToCal(currentActivePage);

    });

    $('#btn-save-ops').click(function () {
        isSaving = true;
        saveCurrentOptions();
    });

    $('#btn-load-ops').click(function () {
        isSaving = false;
        loadSavedOptions();
    });
    $('#btn-continue').click(function () {
        if (isSaving) {
            addSchedOption(currentActivePage, getCurrSchedEvents());
            var options = JSON.stringify(getSchedOptionsList());
            deleteFromLocalStorage(cookieName);
            saveOnLocalStorage(cookieName,options);
        } else {
            var optionsList = JSON.parse(retrieveFromLocalStorage(cookieName));
            setSchedOptionsList(optionsList);
            currentActivePage=1;
            numberOfPages=optionsList.length;
            $('#pagination-list').html(generatePaginationHTML(currentActivePage));
            loadSchedulesToCal(currentActivePage);
        }
    });

};
function byteLength(str) {
    // returns the byte length of an utf8 string
    var s = str.length;
    for (var i=str.length-1; i>=0; i--) {
        var code = str.charCodeAt(i);
        if (code > 0x7f && code <= 0x7ff) s++;
        else if (code > 0x7ff && code <= 0xffff) s+=2;
        if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
    }
    return s;
}
var setPaginationControl = function () {
    $('#pagination-list li a').click(function () {
        currentActivePage = $('#pagination-list li.active').text();
        var newPage = $(this).text();
        addSchedOption(currentActivePage, getCurrSchedEvents());
        currentActivePage = newPage;
        $('#pagination-list').html(generatePaginationHTML(currentActivePage));
        loadSchedulesToCal(currentActivePage);
    });
};
var setTabFunctionality = function () {
    var tabID = 1;
    $('#btn-add-tab').click(function () {
        tabID++;
        var courseName = $('#course-ddl').val().toString();
        getHTTPSchedulesForCourse(tabID, courseName);

    });
    $('#tab-list').on('click', '.close', function () {
        var tabID2 = $(this).parents('a').attr('href');
        $(this).parents('li').remove();
        $(tabID2).remove();
        tabClassesArr.splice(tabID - 2, 1);
        tabID--;
        var tabFirst = $('#tab-list a:last');
        tabFirst.tab('show');
    });

};
var populateDropDown = function (courseList) {
    $("#course-ddl").select2({
        data: courseList
    });
};
var loadSchedulesToPanel = function (tabNumber, courseName, jsonArr) {
    if (jsonArr != null) {
        generateTabPanelHTML(tabNumber, courseName);
        jsonArr.forEach(function (item, courseNumber) {
            var table = $('#schedules_table' + tabNumber);
            if (item.teacher != null)
                var misProfData = item.teacher.misProfesoresData;
            var laboratory = item.laboratory;
            var alternative = item.alternative;
            var stringToAppend = '';
            stringToAppend = stringToAppend + ('<li class="list-group-item"><table>');
            stringToAppend = stringToAppend + (generateClassPanelHTML(item));
            if (misProfData != null) {
                stringToAppend = stringToAppend + (generateMPDPanelHTML(misProfData));
            }
            if (alternative != null) {
                stringToAppend = stringToAppend + (generateClassPanelHTML(alternative));
                if (alternative.teacher.misProfesoresData != null)
                    stringToAppend = stringToAppend + (generateMPDPanelHTML(alternative.teacher.misProfesoresData));
            }
            if (laboratory != null) {
                stringToAppend = stringToAppend + (generateClassPanelHTML(laboratory));
                if (laboratory.teacher.misProfesoresData != null)
                    stringToAppend = stringToAppend + (generateMPDPanelHTML(laboratory.teacher.misProfesoresData));
            }
            stringToAppend = stringToAppend + ('<tr>' +
                '<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>' +
                '<td><button type="button" class="btn btn-primary btn-add-class-' + tabNumber + '-' + (courseNumber + 1) + '">Seleccionar grupo</button></td></tr>')
            stringToAppend = stringToAppend + ('</table></li>');

            table.append(stringToAppend);
            setOnAddClassBtnClickListener(tabNumber, courseNumber + 1);
            var tabLast = $('#tab-list a:last');
            tabLast.tab('show');
        });
    }
};
var addClassToCalendar = function (jsonClass) {
    if (checkIfUniqueClass(jsonClass) || jsonClass.classType == 'L') {
        var teacherName = formatTeacherName(jsonClass.teacher.name);
        if (jsonClass.alternative != null) {
            var altTeacherName = formatTeacherName(jsonClass.alternative.teacher.name);
            if (altTeacherName != teacherName && jsonClass.schedule == jsonClass.alternative.schedule && jsonClass.days == jsonClass.alternative.days)
                teacherName += ' / ' + altTeacherName;

        }
        var bgc = '#2AC2CC';
        var eventsTime = formatCalEventTime(jsonClass.days, jsonClass.schedule);
        var classID = jsonClass.department + '-' + jsonClass.key;
        var eventMsg = formatCourseName(jsonClass.name) + ' - ' + teacherName + ' - ' + jsonClass.classType;

        eventsTime.forEach(function (item, i) {
            var newEvent = {
                id: classID,
                title: eventMsg,
                start: item.startTime,
                end: item.endTime,
                backgroundColor: bgc,
                textColor: '#FFF',
                data: jsonClass
            };
            addCurrSchedEvent(newEvent);
        });

        refreshCalendar();
    }
};
var refreshCalendar = function () {
    // Refresh calendar
    $('.mycal').remove();
    $('.cal-container').append('<div class="mycal"></div>');
    updateCalendarSettings();
    setPaginationControl();

};
var loadSchedulesToCal = function (activePage) {
    var list = getSchedOptionsList();
    var temp = list[(activePage - 1)];
    clearCurrSchedEvents();
    if (temp != null)
        setCurrSchedEvents(temp);
    refreshCalendar();

};


// -----DATA FORMATTING-----
var formatDays = function (days) {
    var dayArr = days.split(',');
    if (dayArr.length > 0) {
        var daysInd = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
        var dayTextArr = [];
        dayArr.forEach(function (item, i) {
            switch (daysInd.indexOf((item + '').toUpperCase())) {
                case 0:
                    dayTextArr.push('domingo');
                    break;
                case 1:
                    dayTextArr.push('lunes');
                    break;
                case 2:
                    dayTextArr.push('martes');
                    break;
                case 3:
                    dayTextArr.push('miércoles');
                    break;
                case 4:
                    dayTextArr.push('jueves');
                    break;
                case 5:
                    dayTextArr.push('viernes');
                    break;
                case 6:
                    dayTextArr.push('sábado');
                    break;
            }
        });
        var text = '';
        for (var x = 0; x < dayTextArr.length - 1; x++) {
            text = text.concat(dayTextArr[x]);
            if (dayTextArr.length > 2 && x != dayTextArr.length - 2) {
                text = text.concat(', ');
            }
        }
        if (dayTextArr.length > 1)
            text = text.concat(' y ');
        text = text.concat(dayTextArr[dayTextArr.length - 1]);
        return text;
    }
};
var formatTeacherName = function (name) {
    if (name.trim().length == 0) {
        return "-"
    }
    else {
        var names = name.split(/\s+/g);
        names.forEach(function (item, i) {
            item = (item + '').toLowerCase();
            item = item[0].toUpperCase() + item.slice(1);
            names[i] = item;
        });
        return names.join(" ");
    }

};
var formatCourseName = function (name) {
    var rom = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
    name = formatTeacherName(name);
    name = name.split(/(?:,| )+/);
    for (var i = 0; i < name.length; i++)
        if (rom.indexOf((name[i] + '').toLowerCase()) >= 0) {
            name[i] = (name[i] + '').toUpperCase();
        }
    return name.join(' ');
};
var formatCalEventTime = function (days, schedule) {
    var month = '01';
    var year = '2017';
    var calDays = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
    var day;
    var calDayArr = [];
    var timeObjs = [];
    schedule = schedule.split('-');
    days = days.split(',');
    days.forEach(function (item, i) {
        var startTime = "";
        var endTime = "";
        var timeObj = {};
        day = calDays.indexOf(item) + 1;
        if (day == -1)
            day = 0;
        else {
            calDayArr.push(day);
            startTime += '0' + day + '-' + month + '-' + year + ' ' + schedule[0] + ':00';
            endTime += '0' + day + '-' + month + '-' + year + ' ' + schedule[1] + ':00';
            timeObj.startTime = startTime;
            timeObj.endTime = endTime;
            timeObjs.push(timeObj);
        }
    });
    return timeObjs;
};


// -----HTML GENERATING ----
var generateTabPanelHTML = function (ind, courseName) {
    var tablist = $('#tab-list'), tabContent = $('#tab-content');
    tablist.append($('<li><a class="tab-head" href="#tab' + ind + '" role="tab" data-toggle="tab"> ' + courseName + '   <button class="close" type="button" title="Cerrar la pestaña">×</button></a></li>'));
    tabContent.append($('<div class="tab-pane fade" id="tab' + ind + '"></div>'));
    var tab = $('#tab' + ind);
    tab.append('<div class="panel panel-primary" style="margin: 0px" ,padding="0px"><div class="panel-heading">' + courseName + '</div><div class="panel-body"><ul class="list-group" id="schedules_table' + ind + '">');
}
var generateClassPanelHTML = function (item) {
    var type = item.classType;
    if ((item.classType + '').toUpperCase() == 'T')
        type = 'Teoría';
    else
        type = 'Laboratorio';
    var text = '\
            <tr>\
            <th><p class="text-primary">Grupo</p></th>\
            <th><p class="text-primary">Tipo</p></th>\
            <th><p class="text-primary">Profesor</p></th>\
            <th><p class="text-primary">Día</p></th>\
            <th><p class="text-primary">Hora</p></th>\
            <th><p class="text-primary">Salón</p></th>\
            <th><p class="text-primary">Campus</p></th>\
            <th><p class="text-primary">Créditos</p></th>\
            <th><p class="text-primary">Comentarios</p></th>\
            </tr>\
            <tr>\
            <td>' + item.groupNum + '</td>\
            <td>' + type + '</td>\
            <td>' + formatTeacherName(item.teacher.name) + '</td>\
        <td>' + formatDays(item.days) + '</td>\
        <td>' + item.schedule + '</td>\
        <td>' + item.classroom + '</td>\
        <td>' + formatTeacherName(item.campus) + '</td>\
        <td>' + item.credits + '</td>\
        <td>' + item.comments + '</td>\
        </tr>';
    return text;
};
var generateMPDPanelHTML = function (item) {
    if (item != null) {
        var text = '<tr><td></td><td></td>\
        <th><p class="text-primary">Coincidencia más cercana</p></th>\
        <th><p class="text-primary">Referencia</p></th>\
        <th><p class="text-primary">Número de evaluaciones</p></th>\
        <th><p class="text-primary">Calificación</p></th>\
            </tr>\
            <tr><td></td><td></td>\
            <td>' + formatTeacherName(item.name) + '</td>\
            <td><a target="_blank" href=\"' + item.link + '\">\
            <img src="res/misprofesores.png" width="100" height="40" border="0"/>\
            </a>\
            </td>\
            <td>' + item.numReviews + '</td>\
            <td>' + item.score + '</td>\
        </tr>';
        return text;
    }
};
var generateModalHTML = function (data) {
    var type = data.classType;
    if ((type + '').toUpperCase() == 'T')
        type = 'Teoría';
    else
        type = 'Laboratorio';
    var text = '<p class="text-primary">Información adicional</p>\
    <ul>\
        <li><p>Días: ' + formatDays(data.days) + '</p>\
               <ul>\
                        <li>Tipo:        ' + type + '</li>\
                        <li>Profesor:    ' + formatTeacherName(data.teacher.name) + '</li>\
                        <li>Salón:       ' + data.classroom + '</li>\
                        <li>Campus:      ' + formatTeacherName(data.campus) + '</li>\
                        <li>Créditos:    ' + data.credits + '</li>\
                        <li>Comentarios: ' + data.comments + '</li>\
                </ul>\
            </li>';

    if (data.laboratory != null) {
        var lab = data.laboratory;
        type = lab.classType;
        if ((type + '').toUpperCase() == 'T')
            type = 'Teoría';
        else
            type = 'Laboratorio';
        text += '\
        <li><p>Días: ' + formatDays(lab.days) + '</p>\
                    <ul>\
                        <li>Tipo:        ' + type + '</li>\
                        <li>Profesor:    ' + formatTeacherName(lab.teacher.name) + '</li>\
                        <li>Salón:       ' + lab.classroom + '</li>\
                        <li>Campus:      ' + formatTeacherName(lab.campus) + '</li>\
                        <li>Créditos:    ' + lab.credits + '</li>\
                        <li>Comentarios: ' + lab.comments + '</li>\
                    </ul>\
            </li>';
    }

    if (data.alternative != null) {
        var alt = data.alternative;
        type = alt.classType;
        if ((type + '').toUpperCase() == 'T')
            type = 'Teoría';
        else
            type = 'Laboratorio';
        text += '\
        <li><p>Días: ' + formatDays(alt.days) + '</p>\
                    <ul>\
                        <li>Tipo:        ' + type + '</li>\
                        <li>Profesor:    ' + formatTeacherName(alt.teacher.name) + '</li>\
                        <li>Salón:       ' + alt.classroom + '</li>\
                        <li>Campus:      ' + formatTeacherName(alt.campus) + '</li>\
                        <li>Créditos:    ' + alt.credits + '</li>\
                        <li>Comentarios: ' + alt.comments + '</li>\
                    </ul>\
            </li>';
    }
    text += '</ul>';

    if (data.teacher.misProfesoresData != null) {
        var mpd = data.teacher.misProfesoresData;
        text += '<p class="text-primary">Evaluación de profesores</p>\
                 <ul>\
                <li><p>' + formatTeacherName(data.teacher.misProfesoresData.name) + '</p>\
                     <ul>\
                            <li>Calificación:              ' + mpd.score + '</li>\
                            <li>Número de evaluaciones:    ' + mpd.numReviews + '</li>\
                            <li>\<a target="_blank" href="' + mpd.link + '\"><img style="margin-bottom: 2px" src="res/misprofesores.png" width="100" height="40" border="0"/></a></li>\
                     </ul>\
                </li>';
    }
    if (data.alternative != null && data.alternative.teacher.misProfesoresData != null && data.alternative.teacher.name != data.teacher.name) {
        mpd = data.alternative.teacher.misProfesoresData;
        text += '<li><p>' + formatTeacherName(data.alternative.teacher.misProfesoresData.name) + '</p>\
                     <ul>\
                            <li>Calificación:              ' + mpd.score + '</li>\
                            <li>Número de evaluaciones:    ' + mpd.numReviews + '</li>\
                            <li>\<a target="_blank" href="' + mpd.link + '\"><img style="margin-bottom: 2px" src="res/misprofesores.png" width="100" height="40" border="0"/></a></li>\
                     </ul>\
                </li>';
    }

    if (data.laboratory != null && data.laboratory.teacher.misProfesoresData != null && data.laboratory.teacher.name != data.teacher.name) {
        mpd = data.laboratory.teacher.misProfesoresData;
        text += '<li><p>' + formatTeacherName(data.laboratory.teacher.misProfesoresData.name) + '</p>\
                     <ul>\
                            <li>Calificación          :' + mpd.score + '</li>\
                            <li>Número de evaluaciones:    ' + mpd.numReviews + '</li>\
                            <li>\<a target="_blank" href="' + mpd.link + '\"><img style="margin-bottom: 2px" src="res/misprofesores.png" width="100" height="40" border="0"/></a></li>\
                     </ul>\
                </li>';
    }
    text += '</ul>';
    return text;
};
var generatePaginationHTML = function (activeId) {
    var n = numberOfPages;
    var text = '';
    for (var i = 1; i <= n; i++) {
        if (i == activeId)
            text += '<li class="active" ><a class="page" href="#">' + i + '</a></li>';
        else
            text += '<li><a class="page" href="#">' + i + '</a></li>';
    }
    return text;
};

// -----EVENT LISTENERS-----
var setOnAddClassBtnClickListener = function (tabID, elemID) {
    $('.btn-add-class-' + tabID + '-' + elemID).click(function () {
        var temp = tabClassesArr[tabID - 2][elemID - 1];
        addClassToCalendar(temp);
        if (temp.alternative != null)
            addClassToCalendar(temp.alternative);
        if (temp.laboratory != null)
            addClassToCalendar(temp.laboratory);
        var tabFirst = $('#tab-list a:first');
        tabFirst.tab('show');
    });
};
var onEventClick = function (eventId) {
    var ev = [];
    ev = getCurrSchedEvents();
    var evIDs = [];
    var data;
    for (var i = 0; i < ev.length; i++) {
        if (ev[i].id == eventId)
            evIDs.push(i);
    }
    if (evIDs.length > 0)
        data = ev[evIDs[0]].data;
    $('#modal-title-txt').text(formatCourseName(data.name) + ' - Grupo ' + data.groupNum);
    $('.modal-body').html(generateModalHTML(data));
    var modal = $('#classModal').modal({backdrop: true, keyboard: true, focus: true, show: true})
    $('#modal-footer').html('<button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button><button id="btn-del-class" type="button" class="btn btn-danger" data-dismiss="modal">Eliminar clase</button>');
    $('#btn-del-class').click(function () {
        removeCurrSchedEvent(eventId);
        refreshCalendar();
    });
    modal.show();

};
var updateCalendarSettings = function () {
    $('.mycal').easycal({
        startDate: '02-01-2017', // OR 31/10/2104
        timeFormat: 'HH:mm',
        columnDateFormat: 'dddd',
        minTime: '07:00:00',
        maxTime: '22:00:00',
        slotDuration: 30,
        timeGranularity: 30,

        dayClick: function (el, startTime) {
        },
        eventClick: onEventClick,
        events: getCurrSchedEvents(),

        overlapColor: '#FF0',
        overlapTextColor: '#000',
        overlapTitle: 'Intersección'
    });

};

// -----VALIDATION-----
var checkIfUniqueClass = function (jsonClass) {
    var id = jsonClass.department + '-' + jsonClass.key;
    var ev = getCurrSchedEvents();
    var unique = true;
    var i = 0;
    while (unique && i < ev.length) {
        unique = ev[i].id != id;
        i++;
    }
    return unique;
};

// ----DATA SAVING-----

function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}
function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
function eraseCookie(name) {
    createCookie(name, "", -1);
}
function saveOnLocalStorage(name,value) {
    localStorage.setItem(name, value);
}
function retrieveFromLocalStorage(name) {
    return localStorage.getItem(name);
}
function deleteFromLocalStorage(name) {
    localStorage.removeItem(name);
}

var saveCurrentOptions = function () {
    var modal = $('#cookie-modal').modal({backdrop: true, keyboard: true, focus: true, show: true});
    $('#cookie-modal-title-txt').text('Guardar opciones de horario actuales en memoria');
    $('#cookie-modal-body-txt').text('Se perderán las opciones de horario guardadas anteriormente. ¿Estás seguro de querer continuar?');
    modal.show();
};

var loadSavedOptions = function () {
    var modal = $('#cookie-modal').modal({backdrop: true, keyboard: true, focus: true, show: true});
    $('#cookie-modal-title-txt').text('Cargar opciones de horario guardadas en memoria');
    $('#cookie-modal-body-txt').text('Se perderán las opciones de horario actuales. ¿Estás seguro de querer continuar?');
    modal.show();

};



