class FencingPoolTracker {
    constructor() {
        this.fencers = [];
        this.tournaments = this.loadTournaments();
        this.currentTournamentId = null;
        this.initializeEventListeners();
        this.setupTournamentManagement();
    }

    initializeEventListeners() {
        const addFencerBtn = document.getElementById('addFencerBtn');
        const fencerNameInput = document.getElementById('fencerName');

        addFencerBtn.addEventListener('click', () => {
            const name = fencerNameInput.value.trim();
            if (name) {
                this.addFencer(name);
                fencerNameInput.value = ''; // Clear input
            }
        });

        fencerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const name = fencerNameInput.value.trim();
                if (name) {
                    this.addFencer(name);
                    fencerNameInput.value = ''; // Clear input
                }
            }
        });
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

    updateDeleteButtonState() {
        const deleteBtn = document.getElementById('deleteTournamentBtn');
        const tournamentSelect = document.getElementById('tournamentSelect');
        deleteBtn.disabled = !tournamentSelect.value;
    }

    saveTournament() {
        const tournamentNameInput = document.getElementById('tournamentName');
        const tournamentName = tournamentNameInput.value.trim();

        if (!tournamentName) {
            alert('Please enter a tournament name');
            return;
        }

        if (this.fencers.length === 0) {
            alert('Please add some fencers before saving');
            return;
        }

        // Create tournament object
        const tournament = {
            id: Date.now().toString(), // Unique identifier
            name: tournamentName,
            date: new Date().toISOString(),
            fencers: JSON.parse(JSON.stringify(this.fencers)) // Deep clone to avoid reference issues
        };

        // Load existing tournaments or initialize
        this.tournaments = this.loadTournaments();

        // Add new tournament
        this.tournaments.push(tournament);

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
        this.fencers = JSON.parse(JSON.stringify(tournament.fencers)); // Deep clone
        this.currentTournamentId = selectedTournamentId;

        // Update the UI
        this.updateFencerList();
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

    addFencer(name) {
        // Check for duplicate names
        if (this.fencers.some(f => f.name === name)) {
            alert('A fencer with this name already exists!');
            return;
        }

        const fencer = {
            name: name,
            matches: [],
            victories: 0,
            defeats: 0,
            pointsScored: 0,
            pointsReceived: 0,
            index: this.fencers.length
        };

        this.fencers.push(fencer);
        this.updateFencerList();
    }

    updateFencerList() {
        const fencerListEl = document.getElementById('fencerList');

        // Store existing input values before recreating the table
        const existingInputValues = {};
        if (fencerListEl.children.length > 1) {
            const existingRows = Array.from(fencerListEl.children).slice(1);
            existingRows.forEach((row, rowIndex) => {
                existingInputValues[rowIndex] = {};
                const inputs = row.querySelectorAll('input');
                inputs.forEach((input) => {
                    const colIndex = input.dataset.colIndex;
                    existingInputValues[rowIndex][colIndex] = input.value;
                });
            });
        }

        fencerListEl.innerHTML = ''; // Clear existing list

        // Create headers
        const headerRow = document.createElement('div');
        headerRow.classList.add('flex', 'mb-2', 'font-bold');
        headerRow.innerHTML = `
            <div class="flex-1 text-left">Fencer</div>
            ${this.fencers.map((_, index) =>
            `<div class="flex-1 text-center">${index + 1}</div>`
        ).join('')}
            <div class="flex-1 text-right">Results</div>
        `;
        fencerListEl.appendChild(headerRow);

        // Create match matrix
        this.fencers.forEach((fencer, rowIndex) => {
            const fencerRow = document.createElement('div');
            fencerRow.classList.add('fencer-row');

            // Fencer name
            const nameCell = document.createElement('div');
            nameCell.classList.add('flex-1', 'text-left');
            nameCell.textContent = fencer.name;
            fencerRow.appendChild(nameCell);

            // Match cells
            this.fencers.forEach((opponent, colIndex) => {
                const matchCell = document.createElement('div');
                matchCell.classList.add('match-cell');

                // Prevent matches against self
                if (rowIndex === colIndex) {
                    matchCell.textContent = '-';
                } else {
                    const matchInput = document.createElement('input');
                    matchInput.type = 'text';
                    matchInput.placeholder = '5-3';
                    matchInput.dataset.rowIndex = rowIndex;
                    matchInput.dataset.colIndex = colIndex;

                    const match = fencer.matches.find(m => m.opponent === opponent.name);
                    if (match) {
                        matchInput.value = `${match.result.fencerScore}-${match.result.opponentScore}`;
                    }
                    matchInput.addEventListener('change', this.updateMatchResult.bind(this));
                    matchCell.appendChild(matchInput);
                }

                fencerRow.appendChild(matchCell);
            });

            // Results cell
            const resultsCell = document.createElement('div');
            resultsCell.classList.add('flex-1', 'text-right', 'match-result');

            // Calculate and display results
            const resultsText = `${fencer.victories}-${fencer.defeats} (${fencer.pointsScored}-${fencer.pointsReceived})`;
            resultsCell.textContent = resultsText;

            fencerRow.appendChild(resultsCell);

            fencerListEl.appendChild(fencerRow);
        });

        this.updateResultSummary();
    }

    updateMatchResult(event) {
        const input = event.target;
        const rowIndex = parseInt(input.dataset.rowIndex);
        const colIndex = parseInt(input.dataset.colIndex);
        const scoreRegex = /^(\d+)\s*-\s*(\d+)$/;
        const match = input.value.trim().match(scoreRegex);

        if (!match) {
            alert('Please enter score in format "5-3"');
            input.value = '';
            return;
        }

        const [, fencerScore, opponentScore] = match;
        const fencer = this.fencers[rowIndex];
        const opponent = this.fencers[colIndex];

        // Prevent duplicate match entries
        const existingMatchIndex = fencer.matches.findIndex(
            m => m.opponent === opponent.name
        );

        // Determine match result
        const matchResult = {
            fencerScore: parseInt(fencerScore),
            opponentScore: parseInt(opponentScore)
        };

        // If match already exists, update it
        if (existingMatchIndex !== -1) {
            const existingMatch = fencer.matches[existingMatchIndex];

            // Subtract previous scores
            fencer.pointsScored -= existingMatch.result.fencerScore;
            fencer.pointsReceived -= existingMatch.result.opponentScore;

            if (existingMatch.result.fencerScore > existingMatch.result.opponentScore) {
                fencer.victories--;
            } else if (existingMatch.result.fencerScore < existingMatch.result.opponentScore) {
                fencer.defeats--;
            }
        }

        // Update fencer statistics
        fencer.pointsScored += matchResult.fencerScore;
        fencer.pointsReceived += matchResult.opponentScore;

        if (matchResult.fencerScore > matchResult.opponentScore) {
            fencer.victories++;
        } else if (matchResult.fencerScore < matchResult.opponentScore) {
            fencer.defeats++;
        }

        // Update or add match details
        if (existingMatchIndex !== -1) {
            fencer.matches[existingMatchIndex] = {
                opponent: opponent.name,
                result: matchResult
            };
        } else {
            fencer.matches.push({
                opponent: opponent.name,
                result: matchResult
            });
        }

        // Ensure symmetric match recording
        const symmetricMatchIndex = opponent.matches.findIndex(
            m => m.opponent === fencer.name
        );

        const symmetricMatchResult = {
            fencerScore: matchResult.opponentScore,
            opponentScore: matchResult.fencerScore
        };

        if (symmetricMatchIndex !== -1) {
            opponent.matches[symmetricMatchIndex] = {
                opponent: fencer.name,
                result: symmetricMatchResult
            };
        } else {
            opponent.matches.push({
                opponent: fencer.name,
                result: symmetricMatchResult
            });
        }

        // Reset and update statistics for opponent
        opponent.pointsScored = opponent.matches.reduce((sum, match) => sum + match.result.fencerScore, 0);
        opponent.pointsReceived = opponent.matches.reduce((sum, match) => sum + match.result.opponentScore, 0);

        opponent.victories = opponent.matches.filter(
            match => match.result.fencerScore > match.result.opponentScore
        ).length;

        opponent.defeats = opponent.matches.filter(
            match => match.result.fencerScore < match.result.opponentScore
        ).length;

        this.updateFencerList();
    }

    updateResultSummary() {
        const resultSummaryEl = document.getElementById('resultSummary');

        // Sort fencers by victories, then by point difference
        const sortedFencers = [...this.fencers].sort((a, b) => {
            // First sort by victories (descending)
            if (b.victories !== a.victories) {
                return b.victories - a.victories;
            }

            // If victories are equal, sort by point difference
            const aDiff = a.pointsScored - a.pointsReceived;
            const bDiff = b.pointsScored - b.pointsReceived;
            return bDiff - aDiff;
        });

        // Create summary table
        const summaryTable = document.createElement('table');
        summaryTable.classList.add('w-full', 'text-sm');
        summaryTable.innerHTML = `
            <thead>
                <tr class="bg-gray-200">
                    <th class="p-2 text-left">Rank</th>
                    <th class="p-2 text-left">Fencer</th>
                    <th class="p-2 text-center">V</th>
                    <th class="p-2 text-center">D</th>
                    <th class="p-2 text-center">Points</th>
                </tr>
            </thead>
            <tbody>
                ${sortedFencers.map((fencer, index) => `
                    <tr class="${index % 2 ? 'bg-gray-50' : ''}">
                        <td class="p-2">${index + 1}</td>
                        <td class="p-2">${fencer.name}</td>
                        <td class="p-2 text-center">${fencer.victories}</td>
                        <td class="p-2 text-center">${fencer.defeats}</td>
                        <td class="p-2 text-center">${fencer.pointsScored}-${fencer.pointsReceived}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        resultSummaryEl.innerHTML = '';
        resultSummaryEl.appendChild(summaryTable);
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const tracker = new FencingPoolTracker();
});