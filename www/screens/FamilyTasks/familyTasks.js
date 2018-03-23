controller.controller('familyTasksCtrl', function ($scope, $stateParams, authService, msgService, safeApply, $timeout) {
    var familyTasksCtrl = {
        controller: {
            calls: {

            },
            actions: {

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
                        console.log(member);
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
                $scope.toggleFtasks = true;
                $scope.togglePtasks = true;
                $scope.addTaskModal = false;
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
                        console.log($scope.tasksP);
                    }
                });
            },
            initFunctions: function(){
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
                $scope.filterTasks = function(filterVal, tab){
                    return function(task){
                        if(!filterVal) return (task.Completed == $scope.tabNav.isTab(tab));
                        return (task.Completed == $scope.tabNav.isTab(tab) &&
                                (task.TaskName.includes(filterVal)));
                    }
                };
                $scope.getIncomplete = function(tasks){
                    return tasks.filter(o => !o.Completed).length;
                };
                $scope.toggleModal = function(status){
                    status ? $('#addTasks').hide() : $('#addTasks').show();
                    $scope.addTaskModal = status;
                    $scope.tab = 'task';
                    safeApply($scope);
                };
                $scope.removeLabel = function(idx){
                    $scope.newTask.labels.splice(idx, 1);
                };
                $scope.addAssigned = function(member){
                    var idx = $scope.newTask.AssignedTo.indexOf(member);
                    if(idx == -1){
                        $scope.newTask.AssignedTo.push({Name: member.Name, UserID: member.ID});
                    }
                    else{
                        $scope.newTask.AssignedTo.splice(idx);
                    }
                };
                $scope.addLabel = function(e, label){
                    if(e.keyCode == 32 || e.keycode == 188){
                        $scope.newTask.Labels.push({Name: label});
                        safeApply($scope);
                        return "";
                    }
                    return label;
                };
                $scope.addTask = function(newTask) {
                    if(newTask.TaskName.length <= 0){
                        msgService.showWarn("Please add a task name!");
                        return;
                    }
                    //$scope.tasksF.push(task);
                    var member = $scope.member;
                    for (var i = 0; i < member.length; i++) {
                        $scope.member[i].assigned = false;
                    }
                    var taskKey = firebase.database().ref('Tasks/'+member.Families.ID).push(newTask);
                    var taskID = taskKey.key;
                    firebase.database().ref('Tasks/'+member.Families.ID+'/'+taskID).update({ID: taskID});
                    $scope.newTask = {
                        ID: '0',
                        Labels: [],
                        Completed: false,
                        TaskName: '',
                        PersonalTask: !$scope.isAdmin(),
                        TaskDueDate: $scope.today,
                        PointsWorth: 0,
                        AssignedTo: [],
                        CreatedBy: $scope.member.displayName,
                        CreatedByUserID: $scope.member.uid,
                        Notes: '',
                        Repeat: '',
                    };
                    $scope.addTaskModal = false;
                    $scope.tab = 'task';
                    $scope.toggleModal(false);
                };
                $scope.taskComplete = function(index, taskType){
                    var idx = $scope[taskType].findIndex(o => o.ID == index);
                    if(!$scope[taskType][idx].Completed){
                        $scope[taskType][idx].Completed = true;
                        $scope[taskType][idx].CompletedBy = $scope.member.displayName;
                        $scope[taskType][idx].CompletedDate = new Date().toLocaleTimeString('en-US', {month:'numeric', day:'numeric', year:'numeric', hour:'numeric', minute:'numeric'});;
                        firebase.database().ref('Tasks/'+$scope.member.Families.ID+'/'+$scope[taskType][idx].ID).set(JSON.parse(angular.toJson($scope[taskType][idx])));
                        safeApply($scope);
                    }
                    else{
                        $scope[taskType][idx].Completed = false;
                        delete $scope[taskType][idx].CompletedBy;
                        delete $scope[taskType][idx].CompletedDate;
                        firebase.database().ref('Tasks/'+$scope.member.Families.ID+'/'+$scope[taskType][idx].ID).set(JSON.parse(angular.toJson($scope[taskType][idx])));
                        safeApply($scope);
                    }
                };
            },
            initWatches: function(){
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
