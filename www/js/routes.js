angular.module('app.routes', ['ionicUIRouter'])
.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state('tabsController', {
        url: '/page1',
        templateUrl: 'screens/tabsController.html',
        abstract: true
    })
    .state('login', {
        url: '/login',
        templateUrl: 'screens/Login/login.html',
        controller: 'loginCtrl'
    })
    .state('register', {
        url: '/register',
        templateUrl: 'screens/Register/register.html',
        controller: 'registerCtrl'
    })
    .state('createJoin', {
        url: '/createJoin',
        templateUrl: 'screens/CreateJoin/createJoin.html',
        controller: 'createJoinCtrl'
    })
    .state('settings', {
        url: '/settings',
        templateUrl: 'screens/Settings/settings.html',
        controller: 'settingsCtrl'
    })
    .state('profile', {
        url: '/profile',
        templateUrl: 'screens/Profile/profile.html',
        controller: 'profileCtrl'
    })
    .state('tabsController.familyTasks', {
        url: '/familyTasks',
        views: {
            'tab1': {
                templateUrl: 'screens/FamilyTasks/familyTasks.html',
                controller: 'familyTasksCtrl'
            }
        }
    })
    .state('tabsController.calendar', {
        url: '/calendar',
        views: {
            'tab2': {
                templateUrl: 'screens/Calendar/calendar.html',
                controller: 'calendarCtrl'
            }
        }
    })
    .state('tabsController.myTasks', {
        url: '/myTasks',
        views: {
            'tab3': {
                templateUrl: 'screens/MyTasks/myTasks.html',
                controller: 'myTasksCtrl'
            }
        }
    })
    $urlRouterProvider.otherwise('/login')
});
