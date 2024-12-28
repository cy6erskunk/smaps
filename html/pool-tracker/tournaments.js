export class Tournaments {
    tournaments = [];
    currentTournamentId = null;

    constructor(getFencers, setFencers) {
        this.tournaments = this.loadTournaments();
        this.setupTournamentManagement();
        this.getFencers = getFencers;
        this.setFencers = setFencers;
    }

    setupTournamentManagement() {
        const tournamentContainer = document.getElementById('tournamentContainer');
        if (!tournamentContainer) {
            const container = document.createElement('div');
            container.id = 'tournamentContainer';
            container.innerHTML = `
                <div class="mb-4">
                    <label for="tournamentName" class="block mb-2">Tournament Name:</label>
                    <input type="text" id="tournamentName" class="w-full p-2 border rounded">
                    <button id="saveTournamentBtn" class="mt-2 p-2 bg-blue-500 text-white rounded">Save Tournament</button>
                </div>
                <div id="savedTournaments" class="mt-4">
                    <h3 class="font-bold mb-2">Saved Tournaments:</h3>
                    <select id="tournamentSelect" class="w-full p-2 border rounded">
                    </select>
                    <button id="loadTournamentBtn" class="mt-2 p-2 bg-green-500 text-white rounded">Load Tournament</button>
                    <button id="deleteTournamentBtn" class="mt-2 p-2 bg-red-500 text-white rounded">Delete Tournament</button>
                </div>
            `;

            document.getElementById('fencerForm').insertAdjacentElement('beforebegin', container);

        }
        // Update tournaments dropdown
        this.updateTournamentsDropdown();
        // Event listeners for tournament management
        document.getElementById('saveTournamentBtn').addEventListener('click', () => this.saveTournament());
        document.getElementById('loadTournamentBtn').addEventListener('click', () => {
            this.loadTournament()
            document.getElementById('loadsavepopover').hidePopover();
        });
        document.getElementById('deleteTournamentBtn').addEventListener('click', () => this.deleteTournament());
        document.getElementById('tournamentSelect').addEventListener('change', () => this.updateDeleteButtonState());
    }

    saveTournament() {
        const tournamentNameInput = document.getElementById('tournamentName');
        const tournamentName = tournamentNameInput.value.trim();
        const fencers = this.getFencers();

        if (!tournamentName) {
            alert('Please enter a tournament name');
            return;
        }

        if (fencers.length === 0) {
            alert('Please add some fencers before saving');
            return;
        }

        const tournament = {
            id: Date.now().toString(), // Unique identifier
            name: tournamentName,
            date: new Date().toISOString(),
            fencers
        };

        // Add new tournament
        this.tournaments.push(tournament);
        this.currentTournamentId = tournament.id;

        // Save to local storage
        localStorage.setItem('fencingTournaments', JSON.stringify(this.tournaments));

        // Update tournaments dropdown
        this.updateTournamentsDropdown();

        // Clear tournament name input
        tournamentNameInput.value = '';

        alert('Tournament saved successfully!');
    }

    loadTournaments() {
        const storedTournaments = localStorage.getItem('fencingTournaments');
        return storedTournaments ? JSON.parse(storedTournaments) : [];
    }

    updateDeleteButtonState() {
        const deleteBtn = document.getElementById('deleteTournamentBtn');
        const tournamentSelect = document.getElementById('tournamentSelect');
        deleteBtn.disabled = !tournamentSelect.value;
    }

    updateTournamentsDropdown() {
        const tournamentSelect = document.getElementById('tournamentSelect');

        // Clear existing options except the first
        tournamentSelect.innerHTML = '<option value="">Select a Tournament</option>';

        // Add tournaments to dropdown
        this.tournaments.forEach(t => {
            const option = document.createElement('option');
            option.value = t.id;
            option.textContent = `${t.name} (${new Date(t.date).toLocaleString()})`;
            tournamentSelect.appendChild(option);
        });
    }

    loadTournament() {
        const tournamentSelect = document.getElementById('tournamentSelect');
        const selectedTournamentId = tournamentSelect.value;

        if (!selectedTournamentId) {
            alert('Please select a tournament to load');
            return;
        }

        // Find the selected tournament
        const tournament = this.tournaments.find(t => t.id === selectedTournamentId);

        if (!tournament) {
            alert('Tournament not found');
            return;
        }

        // Reset current state
        this.setFencers(structuredClone(tournament.fencers));
        this.getFencers();
        this.currentTournamentId = selectedTournamentId;
    }

    deleteTournament() {
        const tournamentSelect = document.getElementById('tournamentSelect');
        const selectedTournamentId = tournamentSelect.value;

        if (!selectedTournamentId) {
            alert('Please select a tournament to delete');
            return;
        }

        // Confirm deletion
        if (!confirm('Are you sure you want to delete this tournament?')) {
            return;
        }

        // Remove tournament from the list
        this.tournaments = this.tournaments.filter(t => t.id !== selectedTournamentId);

        // Save updated tournaments to local storage
        localStorage.setItem('fencingTournaments', JSON.stringify(this.tournaments));

        // Update dropdown
        this.updateTournamentsDropdown();

        // Reset current tournament if it was the deleted one
        if (this.currentTournamentId === selectedTournamentId) {
            this.currentTournamentId = null;
            this.fencers = [];
            this.updateFencerList();
        }

        alert('Tournament deleted successfully!');
    }

}