controller.controller('calendarCtrl', function ($scope, $stateParams, authService, safeApply, msgService) {
    var calendarCtrl = {
        controller: {
            calls: {

            },
            actions: {

            }
        },
        view:{
            init: function(){
                $scope.calendar = {};
                // Check valid user email and valid user password
                authService.checkLogin().then(function(member){
                    if(member){
                        /***Variables***/
                        $scope.member = member;
                        //console.log(member);
                        $scope.family = Object.values(member.Family.FamilyMembers);
                        /***Functions***/
                        calendarCtrl.view.initFunctions();
                        calendarCtrl.view.initVariables();
                        calendarCtrl.view.initWatches();
                    }
                });
            },
            initVariables: function(){
                $scope.tasks = [];
                $scope.showModal = false;
                $scope.modal;
                firebase.database().ref('Tasks/'+$scope.member.Family.ID).on('value',function(snap){
                    if(snap.val()){
                        var tasks = Object.values(snap.val()).filter(o =>
                            !o.Completed && (
                            !o.PersonalTask ||
                            (o.PersonalTask && o.CreatedByUserID == $scope.member.uid))
                        );
                        $scope.tasks = tasks;
                        for (var i = 0; i < tasks.length; i++) {
                            var taskType = tasks[i].PersonalTask ? 'Personal: ' : '';
                            tasks[i]["allDay"] = false;
                            tasks[i]["title"] = taskType + tasks[i].TaskName;
                            tasks[i]["startTime"] = new Date(tasks[i].TaskDueDate);
                            tasks[i]["endTime"] = new Date(tasks[i].TaskDueDate);
                        }
                        $scope.calendar.eventSource = tasks;
                        safeApply($scope);
                    }
                    else{
                        $scope.tasks = [];
                    }
                });
            },
            initFunctions: function(){
                $scope.isToday = function () {
                    var today = new Date(),
                        currentCalendarDate = new Date($scope.calendar.currentDate);

                    today.setHours(0, 0, 0, 0);
                    currentCalendarDate.setHours(0, 0, 0, 0);
                    return today.getTime() === currentCalendarDate.getTime();
                };
                $scope.today = function () {
                    $scope.calendar.currentDate = new Date();
                };
                $scope.changeMode = function (mode) {
                    $scope.calendar.mode = mode;
                };
            },
            initWatches: function(){
                $scope.onTaskSelected = function (task) {
                    //console.log(task);
                    $scope.showModal = true;
                    $scope.modal = task;
                };
            }
        }
    };
    calendarCtrl.view.init();
    $scope.onViewTitleChanged = function (title) {
        $scope.viewTitle = title;
    };
});
