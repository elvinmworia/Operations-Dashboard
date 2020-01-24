// GLOBAL APP CONTROLLER
class Controller {
    static setupEventListeners() {
        let DOMstrings = UIController.getDOMstrings();
        document
            .querySelector(DOMstrings.logoutBtn)
            .addEventListener("click", AuthController.logout);
        document
            .querySelector(DOMstrings.codingProgressLinkSelector)
            .addEventListener("click", Controller.navigateToCodingProgress);
        document
            .querySelector(DOMstrings.projectMenu)
            .addEventListener("click", Controller.navigateToSelectedProject);
    }

    static resetUI() {
        let DOMstrings = UIController.getDOMstrings();
        document.querySelector(DOMstrings.codingProgressContainer).innerHTML = "";
        document.querySelector(DOMstrings.graphContainer).innerHTML = "";
    }

    static displayCodingProgress() {
        // Add the coding progress section to the UI
        UIController.addCodingProgressSection();
        // Get data for coding progress table
        let unsubscribeFunc = DataController.watchCodingProgress(UIController.updateProgressUI);
        DataController.registerSnapshotListener(unsubscribeFunc);
    }

    static displayProject(project) {
        // Add the graphs container to the UI
        UIController.addGraphs(project);
        // Update and show the Graphs
        let unsubscribeFunc = DataController.watchProjectTrafficData(
            project,
            GraphController.updateGraphs
        );
        DataController.registerSnapshotListener(unsubscribeFunc);
    }

    static navigateToCodingProgress(e) {
        if (e.target && e.target.nodeName == "A") {
            Controller.resetUI();
            DataController.detachSnapshotListener();
            window.location.hash = "coding_progress";
            Controller.displayCodingProgress();
        }
    }

    static navigateToSelectedProject(e) {
        if (e.target && e.target.nodeName == "A") {
            Controller.resetUI();
            DataController.detachSnapshotListener();
            console.log(e.target.innerText);
            let project = e.target.innerText;
            window.location.hash = `traffic-${project}`;
            Controller.displayProject(project);
        }
    }

    static displayDeepLinkedTrafficPage(activeProjectsData) {
        let activeProjects = [],
            page_route = window.location.hash.substring(1);
        activeProjectsData.forEach(project => {
            activeProjects.push(project.project_name);
        });
        let project = page_route.split("-")[1];
        if (activeProjects.includes(project)) {
            Controller.displayProject(project);
        } else {
            // update the URL and replace the item in the browser history
            // without reloading the page
            history.replaceState(null, null, " ");
            Controller.displayCodingProgress();
        }
    }

    static init() {
        console.log("Application has started.");
        // Authorize user
        AuthController.getUser();
        // set up event listeners
        Controller.setupEventListeners();
        // Add the dropdown menu to the UI
        DataController.watchActiveProjects(UIController.addDropdownMenu);
        // Get hash value
        let page_route = window.location.hash.substring(1);
        // Navigate appropriately according to the hash value
        if (page_route) {
            if (page_route == "coding_progress") {
                Controller.displayCodingProgress();
            } else if (page_route.startsWith("traffic-")) {
                DataController.watchActiveProjects(Controller.displayDeepLinkedTrafficPage);
            } else {
                // update the URL and replace the item in the browser history
                // without reloading the page
                history.replaceState(null, null, " ");
                Controller.displayCodingProgress();
            }
        } else {
            Controller.displayCodingProgress();
        }
    }
}

// Initialize the application
const mediadb = firebase.firestore(),
    settings = { timestampsInSnapshots: true };
mediadb.settings(settings);
Controller.init();
