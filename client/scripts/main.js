var $start               = $(".b-btn__start"),
    $reset               = $(".b-btn__reset"),
    $breakReset          = $(".b-btn__breakReset"),
    $break               = $(".b-btn__break"),
    $roundTimeBox        = $(".b-round-time"),
    $task                = $(".b-timer__task"),
    $taskNameBox         = $(".b-task__name"),
    $timerMin            = $('#timerMin'),
    $timerSec            = $('#timerSec'),
    $pomoEndAudio        = $('#pomoEndAudio'),
    defaultDuration      = 3, //продолжительность помидора sec
    defaultBreakDuration = 6, //продолжительность паузы sec
    pomoTodoRound        = 0,
    intervalI, //идентефикатор интервала
    //todos
    inputText            = document.querySelector("#todoText"),
    todosList            = document.querySelector("#todoList"),
    todosLeft            = document.querySelector("#todosLeft"),
    clearCompleted       = document.querySelector("#clearCompleted"),
    markAllCompleted     = document.querySelector("#markAllCompleted"),

    showAll              = document.querySelector("#showAll"),
    showActive           = document.querySelector("#showActive"),
    showCompleted        = document.querySelector("#showCompleted"),
    todoIndexValue       = 0,
    globaltodoFilter     = null,
    todos                = [];

$(document).ready(function () {
  setDuration(defaultDuration);
  $start.click(pomoStart);
  $reset.click(pomoReset);
  $breakReset.click(breakReset);
  $break.click(pomoBreakStart);
});

$('#signInButton').click(function (e) {
  e.preventDefault();
  var loginValue = $("[name='login']").val();
  var passwordValue = $("[name='password']").val();
  $.ajax({
    url   : "/signin",
    method: "POST",
    data  : {
      login   : loginValue,
      password: passwordValue
    }
  }).then(function (res) {
    $('#signInModal').modal('hide');
    $(".b-sign__in").hide();
    $('.b-sign__up').hide();
    $('#userName').text(res.login).show();
    $('.b-logout').show();
    updateLocalStorage(res);
    init();
  }, function (error) {
    alert(error.responseJSON.messages[0]);
  });

});
$('#signUpButton').click(function (e) {
  e.preventDefault();
  var loginValue = $("[name='login']").val();
  var passwordValue = $("[name='password']").val();
  $.ajax({
    url   : "/signup",
    method: "POST",
    data  : {
      login   : loginValue,
      password: passwordValue
    }
  }).then(function (res) {
    if (res) {
      $('#signUpModal').modal('hide');
      $(".b-sign__in").hide();
      $('.b-sign__up').hide();
      $('#userName').text(res.login).show();
      $('.b-logout').show();
      updateLocalStorage(res);
    }
  }, function (error) {
    if (error.status == 401) {
      alert('Maybe you entered a wrong username or password');
    } else {
      alert(error.responseJSON.messages[0]);
    }
  });
});

$('.b-logout').click(function () {
      $(".b-sign__in").show();
      $('.b-sign__up').show();
      $('.b-logout').hide();
      deleteLocalStorage();
      window.location = "/";
});

function pomoStart () {
  var eventTime = moment().add(defaultDuration, "s").unix(),
      currentTime = moment().unix(),
      diffTime = eventTime - currentTime,
      duration = moment.duration(diffTime * 1000, 'milliseconds'),
      interval = 1000;
  $start.hide();
  $reset.show();

  intervalI = setInterval(function () {
    duration = moment.duration(duration.asMilliseconds() - interval, 'milliseconds');
    var m = moment.duration(duration).minutes(),
        s = moment.duration(duration).seconds();
    $timerMin.text($.trim(m).length === 1 ? '0' + m : m);
    $timerSec.text($.trim(s).length === 1 ? '0' + s : s);
    $roundTimeBox.text(defaultDuration + " min");
    if (!m && !s) {
      pomoFinished();
      clearInterval(intervalI);
    }
  }, interval);
}
function pomoFinished () {
  audioPlay($pomoEndAudio);
  $start.show();
  $break.show();
  $reset.hide();
  setDuration(defaultDuration);
  updatePomoRounds();
}

function updatePomoRounds () {
  var todo = todos.filter(function (item) {
    return item.pinStatus == true;
  });
  todo = todo[0];
  pomoTodoRound = todo.pomoRounds + 1;
  todo.pomoRounds = pomoTodoRound;
  $.ajax({
    dataType: "json",
    url     : "/todo/update",
    method  : "POST",
    data    : todo
  }).then(function (res) {
    pomoRoundsCount(todo);
  }, function (error) {
    console.log("Error when updating PomoTodo rounds: ", error.responseJSON.messages);
  });
}
function pomoRoundsCount (todo) {
  $(".list-group-item[todo-index='" + todo._id + "'] .b-round__num").text(todo.pomoRounds);
}
function pomoBreakStart () {
  var eventTime   = moment().add(defaultBreakDuration, "s").unix(),
      currentTime = moment().unix(),
      diffTime    = eventTime - currentTime,
      duration    = moment.duration(diffTime * 1000, 'milliseconds'),
      interval    = 1000;
  $start.hide();
  $break.hide();
  $breakReset.show();
  intervalI = setInterval(function () {
    duration = moment.duration(duration.asMilliseconds() - interval, 'milliseconds');
    var m = moment.duration(duration).minutes(),
        s = moment.duration(duration).seconds();
    $timerMin.text($.trim(m).length === 1 ? '0' + m : m);
    $timerSec.text($.trim(s).length === 1 ? '0' + s : s);

    if (!m && !s) {
      breakFinished();
      clearInterval(intervalI);
    }
  }, interval);
}
function breakFinished () {
  audioPlay($pomoEndAudio);
  $reset.hide();
  $break.hide();
  $breakReset.hide();
  $start.show();
  setDuration(defaultDuration);

}

function pomoReset () {
  var isConfirm = confirm('You are currently in a pomo, do you really want to abandon?');
  if (isConfirm) {
    setDuration(defaultDuration);
    $start.show();
    $reset.hide();
    clearInterval(intervalI);
  }
}
function breakReset () {
  var isConfirm = confirm('Are you sure that you want to stop the pause?');
  if (isConfirm) {
    setDuration(defaultDuration);
    $start.show();
    $reset.hide();
    $breakReset.hide();
    clearInterval(intervalI);
  }
}

function audioPlay (audioItem) {
  audioItem.trigger('play');
  setTimeout(function () {
    audioItem.trigger('pause')
  }, 2000);
}
function setDuration (defaultDuration) {
  $timerMin.text('00');
  $timerSec.text(defaultDuration < 10 ? '0' + defaultDuration : defaultDuration);
  clearInterval(intervalI);
}

inputText.onkeypress = function (e) {
  if (e.keyCode == 13) {
    todoIndexValue++;
    var newTodo = {
      text      : inputText.value,
      isDone    : false,
      pinStatus : false,
      pomoRounds: pomoTodoRound
    };
    $.ajax({
      dataType: "json",
      url     : "/todo/add",
      method  : "POST",
      data    : newTodo
    }).then(function (res) {
      todos.push(res);
      inputText.value = "";
      renderTodos(globalTodoFilter);
      countActiveTodos();
    }, function (error) {
      if (error.status == 401) {
        alert('Pleas, before start, you need be authorized');
      } else {
        alert(error.responseJSON.messages[0]);
      }
    });
  }
};

clearCompleted.onclick = function () {
  todos.forEach(function (todo) {
    if (todo.isDone == true) {
      $.ajax({
        dataType: "json",
        url     : "/todo/delete",
        method  : "POST",
        data    : todo
      }).then(function (res) {
        var li = document.querySelector("li[todo-index='" + todo._id + "']");
        todosList.removeChild(li);
        init();
      }, function (error) {
        alert('Error when deleting todo' + error.responseJSON.messages[0]);
      });
    }
  });
};

markAllCompleted.onclick = function () {
  var activeTodos = todos.filter(function (todo) {
    return todo.isDone == false;
  }).length;

  if (activeTodos == 0) {
    todos.forEach(function (todo) {
      changeTodoStatus(todo, "", false);
    });
  } else {
    todos.forEach(function (todo) {
      changeTodoStatus(todo, "todo-done", true);
    });
  }
  countActiveTodos();
};

showActive.onclick = function () {
  renderTodos(false);
};

showAll.onclick = function () {
  renderTodos(null);
};

showCompleted.onclick = function () {
  renderTodos(true);
};

function renderTodos (todoFilter) {
  highlighButton(todoFilter);
  globalTodoFilter = todoFilter;

  var filteredTodos = todos;
  todosList.innerHTML = "";

  if (todos.length == 0) {
    todosList.innerHTML = "";
    return;
  }
  if (todoFilter != null) {
    todosList.innerHTML = "";
    function checkArr (arr) {
      for (var key in arr) {
        if (key == 'isDone') {
          return arr[key] == todoFilter;
        }
      }
    }

    filteredTodos = filteredTodos.filter(checkArr);
  }

  filteredTodos.forEach(function (todo) {
    var todoElementTemplate = document.querySelector("div#hollow li").cloneNode(true);
    todoElementTemplate.querySelector("span.b-todo__text").innerText = todo.text;
    $(todoElementTemplate).attr("todo-index", todo._id);
    todoElementTemplate.setAttribute("pin-status", "false");
    todoElementTemplate.querySelector(".b-round__num").innerText = todo.pomoRounds;

    if (todo.isDone == true) {
      todoElementTemplate.setAttribute("class", "list-group-item todo-done");
      todoElementTemplate.querySelector("input").checked = true;
    }

    todoElementTemplate.querySelector("input").onchange = function (e) {
      var li = e.path[1];
      var todoIndex = li.getAttribute("todo-index");
      var todo = todos.filter(function (todo) {
        return todo._id == todoIndex;
      });

      todo = todos[todos.indexOf(todo[0])];
      todo.isDone = !!e.path[0].checked;

      $.ajax({
        dataType: "json",
        url     : "/todo/update",
        method  : "POST",
        data    : todo
      }).then(function () {
        if (e.path[0].checked) {
          li.setAttribute("class", "list-group-item todo-done");
        } else {
          li.setAttribute("class", "list-group-item");
        }
        countActiveTodos();

      }, function (error) {
        console.log("Error when updating todo: ", error.responseJSON.messages);
      });
    };
    todoElementTemplate.querySelector("button.b-btn__pin").onclick = function (e) {
      var $li = $(e.path[2]);
      var $taskText = $li[0].firstElementChild.nextSibling.innerText;
      var pinStatus = $li.attr("pin-status");
      var newPinStatus = pinStatus === 'false';
      var $todoIndex = $li.attr("todo-index");
      $li.attr("pin-status", newPinStatus);
      $task.text('');
      $task.text($taskText);
      $taskNameBox.text($taskText);
      $task.attr('timer-id', $todoIndex);
      $task.show();
      var todo = todos.filter(function (item) {
        return item._id == $todoIndex;
      });
      todo[0].pinStatus = newPinStatus;
      $.ajax({
        dataType: "json",
        url     : "/todo/update",
        method  : "POST",
        data    : todo[0]
      }).then(function () {

      }, function (error) {
        console.log("Error when updating todo: ", error.responseJSON.messages);
      });
    };
    todosList.appendChild(todoElementTemplate);
  });
}

function changeTodoStatus (todo, liClass, todoState) {
  var li = document.querySelector("li[todo-index='" + todo._id + "']");
  var checkbox = li.querySelector("input");
  todo.isDone = todoState;
  checkbox.checked = todoState;
  li.setAttribute("class", "list-group-item " + liClass);
  $.ajax({
    dataType: "json",
    url     : "/todo/update",
    method  : "POST",
    data    : todo
  }).then(function () {
    init();
    countActiveTodos();
  }, function (error) {
    console.log("Error when updating todo: ", error.responseJSON.messages);
  });
}


function highlighButton (todoFilter) {
  document.querySelectorAll("div.btn-group .btn").forEach(function (button) {
    button.setAttribute("class", "btn btn-default");
  });

  switch (todoFilter) {
    case true:
      showCompleted.setAttribute("class", "btn btn-primary");
      break;
    case false:
      showActive.setAttribute("class", "btn btn-primary");
      break;
    case null:
      showAll.setAttribute("class", "btn btn-primary");
      break;
  }
}

function countActiveTodos () {
  var activeTodos = todos.filter(function (todo) {
    return todo.isDone == false;
  });
  todosLeft.innerText = activeTodos.length;
}
function updateLocalStorage(res) {
  localStorage.setItem("user", res._id);
}
function deleteLocalStorage(){
  localStorage.clear();
}

function init(){
  setDuration(defaultDuration);
  console.log('localStorage.getItem("user") --> ',localStorage.getItem("user") );
   if (localStorage.getItem("user")) {
     $.ajax({
       url   : "/todo",
       method: "GET"
     }).then(function (res) {
       todos = res;
       renderTodos(null);
       countActiveTodos();
     })
   } 
}





