controller.controller('familyTasksCtrl', function ($scope, $stateParams, authService, msgService, safeApply, $timeout) {
    var familyTasksCtrl = {
        controller: {
            calls: {

            },
            actions: {
                resetMemberAssigned: function(){
                    for (var i = 0; i < $scope.family.length; i++) {
                        $scope.family[i].assigned = false;
                    }
                }
            }
        },
        view:{
            init: function(){
                // Check valid user email and valid user password
                authService.checkLogin().then(function(member){
                    if(member){
                        /***Variables***/
                        $scope.member = member;
                        $scope.family = Object.values(member.Family.FamilyMembers);
                        //console.log(member);
                        /***Functions***/
                        familyTasksCtrl.view.initFunctions();
                        familyTasksCtrl.view.initVariables();
                        familyTasksCtrl.view.initWatches();
                    }
                });
            },
            initVariables: function(){
                /***Variables**/
                $scope.tab = 'task';
                $scope.showMore = false;
                $scope.pActive = false;
                $scope.updateTasks = false;
                $scope.toggleFtasks = true;
                $scope.togglePtasks = true;
                $scope.addTaskModal = false;
                $scope.addDueDate = false;
                $scope.tasksF = [];
                $scope.tasksP = [];
                $scope.newTask = {name: '', assign: {}, date: '', repeat: '', labels: [], points: '', notes: ''};
                $scope.today = new Date().toLocaleTimeString('en-US', {month:'numeric', day:'numeric', year:'numeric', hour:'numeric', minute:'numeric'});
                $scope.newTask = {
                    ID: '0',
                    Labels: [],
                    Completed: false,
                    TaskName: '',
                    PersonalTask: !$scope.isAdmin(),
                    TaskDueDate: $scope.today,
                    PointsWorth: 0,
                    AssignedTo: [],
                    CreatedOn: $scope.today,
                    CreatedBy: $scope.member.displayName,
                    CreatedByUserID: $scope.member.uid,
                    Notes: '',
                    Repeat: '',
                };
                $scope.labelsArr;
                firebase.database().ref('Tasks/'+$scope.member.Family.ID).on('value',function(snap){
                    if(snap.val()){
                        $scope.tasksF = Object.values(snap.val()).filter(o => !o.PersonalTask);
                        $scope.tasksP = Object.values(snap.val()).filter(o => (o.PersonalTask && $scope.member.uid == o.CreatedByUserID));
                        //console.log($scope.tasksF);
                        //console.log($scope.tasksP);
                    }
                    else{
                        $scope.tasksF = [];
                        $scope.tasksP = [];
                    }
                });
            },
            initFunctions: function(){
                $scope.toggleAddDueDate = function(val){
                    $scope.addDueDate = val;
                };
                $scope.isAdmin = function(){
                    var validRoles = ["Admin", "Owner"];
                    var role = $scope.family.filter(o => o.ID == $scope.member.uid);
                    if(role.length){
                        // If owner or admin return true else false
                        return (validRoles.indexOf(role[0].Role) != -1);
                    }
                };
                $scope.tabNav = {
                    isTab: function(tab){
                        return $scope.tab == tab;
                    },
                    setTab: function(tab){
                        $scope.tab = tab;
                    }
                };
                $scope.filterTasks = function(filterVal){
                    var val = filterVal ? filterVal.toLowerCase() : '';
                    return function(task){
                        if(!filterVal) return (task.Completed == $scope.tabNav.isTab('completed'));
                        var r = (task.Completed == $scope.tabNav.isTab('completed') &&
                                (task.TaskName.toLowerCase().includes(val)) );
                        if(task.AssignedTo && task.Labels){
                            return (task.AssignedTo.findIndex(i => i.Name.toLowerCase().includes(val)) != -1 || r ||
                                    (task.Labels.findIndex(i => i.Name.toLowerCase().includes(val)) != -1));
                        }
                        else if(task.Labels){
                            return (task.Labels.findIndex(i => i.Name.toLowerCase().includes(val)) != -1 || r);
                        }
                        else if(task.AssignedTo){
                            return (task.AssignedTo.findIndex(i => i.Name.toLowerCase().includes(val)) != -1 || r);
                        }
                        else return r;
                    }
                };
                $scope.getIncomplete = function(tasks){
                    return tasks.filter(o => !o.Completed).length;
                };
                $scope.getComplete = function(tasks){
                    return tasks.filter(o => o.Completed).length;
                };
                $scope.toggleModal = function(status){
                    status ? $('#addTasks').hide() : $('#addTasks').show();
                    $scope.addTaskModal = status;
                    $scope.tab = 'task';
                    $scope.updateTasks = false;
                    $scope.newTask = {
                        ID: '0',
                        Labels: [],
                        Completed: false,
                        TaskName: '',
                        PersonalTask: !$scope.isAdmin(),
                        TaskDueDate: $scope.today,
                        PointsWorth: 0,
                        AssignedTo: [],
                        CreatedOn: $scope.today,
                        CreatedBy: $scope.member.displayName,
                        CreatedByUserID: $scope.member.uid,
                        Notes: '',
                        Repeat: '',
                    };
                    safeApply($scope);
                };
                $scope.removeLabel = function(idx){
                    $scope.newTask.Labels.splice(idx, 1);
                };
                $scope.addAssigned = function(member){
                    var idx = $scope.newTask.AssignedTo.findIndex(i => i.UserID == member.ID);
                    //console.log(idx);
                    if(idx == -1){
                        $scope.newTask.AssignedTo.push({Name: member.Name, UserID: member.ID});
                    }
                    else{
                        $scope.newTask.AssignedTo.splice(idx, 1);
                    }
                    //console.log($scope.newTask.AssignedTo);
                };
                $scope.addLabel = function(e, label){
                    if(label && e.keyCode == 32 || e.keycode == 44){
                        if(/\S/.test(label)){
                            $scope.newTask.Labels.push({Name: label});
                        }
                        safeApply($scope);
                        return "";
                    }
                    return label;
                };
                $scope.addTask = function(newTask, isUpdate = false) {
                    if(newTask.TaskName.length <= 0){
                        msgService.showWarn("Please add a task name!");
                        return;
                    }
                    //$scope.tasksF.push(task);
                    var member = $scope.member;
                    for (var i = 0; i < member.length; i++) {
                        $scope.member[i].assigned = false;
                    }
                    newTask.TaskDueDate = $scope.addDueDate ? newTask.TaskDueDate : '';
                    //newTask.CreatedOn = $scope.addDueDate ? newTask.CreatedOn : '';
                    if(newTask.TaskDueDate != '')
                        $scope.newTask.TaskDueDate = moment($scope.newTask.TaskDueDate).format('MM-DD-YY, h:mm a');
                    if(isUpdate){
                        $scope.updateTask(newTask);
                    }
                    else{
                        var taskKey = firebase.database().ref('Tasks/'+member.Families.ID).push(newTask);
                        var taskID = taskKey.key;
                        firebase.database().ref('Tasks/'+member.Families.ID+'/'+taskID).update({ID: taskID});
                    }
                    $scope.newTask = {
                        ID: '0',
                        Labels: [],
                        Completed: false,
                        TaskName: '',
                        PersonalTask: !$scope.isAdmin(),
                        TaskDueDate: $scope.today,
                        PointsWorth: 0,
                        AssignedTo: [],
                        CreatedOn: $scope.today,
                        CreatedBy: $scope.member.displayName,
                        CreatedByUserID: $scope.member.uid,
                        Notes: '',
                        Repeat: '',
                    };
                    $scope.addTaskModal = false;
                    $scope.tab = 'task';
                    $timeout(function(){
                        $scope.toggleModal(false);
                    },1000);
                };
                $scope.taskComplete = function(index, taskType){
                    var idx = $scope[taskType].findIndex(o => o.ID == index);
                    if(!$scope[taskType][idx].Completed){
                        $scope[taskType][idx].Completed = true;
                        $scope[taskType][idx].CompletedBy = $scope.member.displayName;
                        $scope[taskType][idx].CompletedDate = new Date().toLocaleTimeString('en-US', {month:'numeric', day:'numeric', year:'numeric', hour:'numeric', minute:'numeric'});;
                        firebase.database().ref('Tasks/'+$scope.member.Families.ID+'/'+$scope[taskType][idx].ID).set(JSON.parse(angular.toJson($scope[taskType][idx])));
                        firebase.database().ref('Families/'+$scope.member.Families.ID+'/FamilyMembers/'+$scope.member.uid+'/Points').once('value',function(snap){
                            var Points = snap.val() + $scope[taskType][idx].PointsWorth;
                            firebase.database().ref('Families/'+$scope.member.Families.ID+'/FamilyMembers/'+$scope.member.uid+'/Points').set(Points);
                        });
                        safeApply($scope);
                    }
                    else{
                        $scope[taskType][idx].Completed = false;
                        delete $scope[taskType][idx].CompletedBy;
                        delete $scope[taskType][idx].CompletedDate;
                        firebase.database().ref('Tasks/'+$scope.member.Families.ID+'/'+$scope[taskType][idx].ID).set(JSON.parse(angular.toJson($scope[taskType][idx])));
                        firebase.database().ref('Families/'+$scope.member.Families.ID+'/FamilyMembers/'+$scope.member.uid+'/Points').once('value',function(snap){
                            var Points = snap.val() - $scope[taskType][idx].PointsWorth;
                            firebase.database().ref('Families/'+$scope.member.Families.ID+'/FamilyMembers/'+$scope.member.uid+'/Points').set(Points);
                        });
                        safeApply($scope);
                    }
                };
                $scope.deleteTask = function(idx, taskType){
                    function confirmation(r){
                        if(r){
                            var famID = $scope.member.Family.ID;
                            var taskIdxToRemove = $scope[taskType][idx].ID;
                            firebase.database().ref('Tasks/'+famID+'/'+taskIdxToRemove).remove();
                            $timeout(function(){
                                msgService.showSuccess("Deleted", "Task has been deleted!");
                            },500);
                        }
                    }
                    msgService.showConfirm(confirmation);
                };
                $scope.editTask = function(task){
                    task = JSON.parse(angular.toJson(task));
                    //console.log(JSON.parse(angular.toJson(task)));
                    task["CreatedBy"] = $scope.member.displayName;
                    task["CreatedByUserID"] = $scope.member.uid;
                    if(!task.Labels)
                        task["Labels"] = [];
                    if(!task.AssignedTo)
                        task["AssignedTo"] = [];
                    else{
                        for (var i = 0; i < $scope.family.length; i++) {
                            for (var j = 0; j < task.AssignedTo.length; j++) {
                                if($scope.family[i].ID == task.AssignedTo[j].UserID)
                                    $scope.family[i]["assigned"] = true;
                            }
                        }
                    }
                    $scope.addDueDate = task.TaskDueDate ? true : false;
                    $scope.updateTasks = true;
                    $scope.addTaskModal = true;
                    $scope.newTask = task;
                    //console.log($scope.newTask);
                };
                $scope.updateTask = function(task){
                    var famID = $scope.member.Family.ID;
                    var taskIdxToRemove = task.ID;
                    firebase.database().ref('Tasks/'+famID+'/'+taskIdxToRemove).set(JSON.parse(angular.toJson(task)));
                    $timeout(function(){
                        $scope.updateTasks = false;
                        msgService.showSuccess("Updated", "Your task has been updated!");
                    },500);
                };
                $scope.isPastDue = function(date){
                    var today = new Date();
                    var isPast = new Date(date);
                    return (today.getTime() > isPast.getTime());
                };
            },
            initWatches: function(){
                $scope.$watch('newTask.PersonalTask', function(now, then){
                    $scope.pActive = now;
                    $scope.newTask.AssignedTo = [];
                    familyTasksCtrl.controller.actions.resetMemberAssigned();
                    $scope.newTask.PointsWorth = 0;
                    safeApply($scope);
                });
                $scope.dragF = {
                    itemMoved: function (event) {

                    },
                    accept: function (sourceItemHandleScope, destSortableScope) {
                        return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
                    },
                    orderChanged: function(event) {

                    },
                    containment: '#FamilyTasks',//optional param.
                    allowDuplicates: false //optional param allows duplicates to be dropped.
                };
                $scope.dragP = {
                    itemMoved: function (event) {

                    },
                    accept: function (sourceItemHandleScope, destSortableScope) {
                        return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
                    },
                    orderChanged: function(event) {

                    },
                    containment: '#PersonalTasks',//optional param.
                    allowDuplicates: false //optional param allows duplicates to be dropped.
                };
            }
        }
    };
    familyTasksCtrl.view.init();
});
