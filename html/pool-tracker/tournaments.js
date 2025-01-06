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
        this.updateTournamentsDropdown();

        document.getElementById('saveTournamentBtn').addEventListener('click', () => this.saveTournament());
        document.getElementById('loadTournamentBtn').addEventListener('click', () => {
            this.loadTournament()
            document.getElementById('loadsavepopover').hidePopover();
        });
        document.getElementById('deleteTournamentBtn').addEventListener('click', () => this.deleteTournament());
        document.getElementById('tournamentSelect').addEventListener('change', () => this.updateDeleteButtonState());
    }

    loadCurrentTournament() {
        this._loadTournament('_current');
    }

    updateCurrentTournament() {
        const tournament = this.tournaments.find(t => t.id === '_current');
        if (tournament) {
            tournament.fencers = this.getFencers();
        } else {
            const currentTournament = {
                id: '_current',
                date: new Date().toISOString(),
                fencers: this.getFencers()
            };
            this.tournaments.push(currentTournament);
        }
        this._saveTournaments();
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

        this._saveTournaments();

        // Update tournaments dropdown
        this.updateTournamentsDropdown();

        // Clear tournament name input
        tournamentNameInput.value = '';

        const label = document.querySelector('label[for="tournamentName"]');
        const successMsg = document.createElement('span');
        successMsg.textContent = ' saved successfully!';
        successMsg.className = 'text-green-600 text-sm text-right';
        label.appendChild(successMsg);

        // Remove message when popup closes
        document.getElementById('loadsavepopover').addEventListener('beforetoggle', () => {
            successMsg.remove();
        }, { once: true });

        // Remove message when input gets focus
        tournamentNameInput.addEventListener('focus', () => {
            successMsg.remove();
        }, { once: true });
    }

    _saveTournaments() {
        // Save to local storage
        localStorage.setItem('fencingTournaments', JSON.stringify(this.tournaments));
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
        this.tournaments.filter(t => t.id !== '_current').forEach(t => {
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

        this._loadTournament(selectedTournamentId);
    }

    _loadTournament(tournamentId) {
        // Find the selected tournament
        const tournament = this.tournaments.find(t => t.id === tournamentId);

        if (!tournament) {
            return;
        }

        // Reset current state
        this.setFencers(structuredClone(tournament.fencers));
        this.getFencers();
        this.updateCurrentTournament();
        this.currentTournamentId = tournamentId;
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