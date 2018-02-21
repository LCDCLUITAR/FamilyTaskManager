factory.factory('msgService', function (){
    this.showSuccess = function(msg) {
        swal("Success!", msg, "success");
    };
    this.showWarn = function(msg) {
        swal("Warning!", msg, "warning");
    };
    this.showError = function(msg) {
        swal("Error!", msg, "error");
    };
    return this;
});
