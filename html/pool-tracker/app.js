import { Tournaments } from './tournaments.js';
class FencingPoolTracker {
    constructor() {
        this.setFencers([]);
        this.tournaments = new Tournaments(() => this.getFencers(), (fencers) => {
            this.setFencers(fencers);
            // Update the UI
            this.updateFencerList();
        });
        this.tournaments.loadCurrentTournament();
        this.initializeEventListeners();
    }

    getFencers() {
        return structuredClone(this.fencers);
    }

    setFencers(fencers) {
        this.fencers = fencers;
    }

    initializeEventListeners() {
        const addFencerBtn = document.getElementById('addFencerBtn');
        const fencerNameInput = document.getElementById('fencerName');
        const clearTournamentBtn = document.getElementById('clearTournamentBtn');

        const handleFencerNameInput = () => {
            const name = fencerNameInput.value.trim();
            if (name) {
                this.addFencer(name);
                fencerNameInput.value = ''; // Clear input
            }
        }

        addFencerBtn.addEventListener('click', handleFencerNameInput);

        fencerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleFencerNameInput();
            }
        });

        clearTournamentBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the current tournament?')) {
                this.setFencers([]);
                this.updateFencerList();
                this.tournaments.updateCurrentTournament();
            }
        });
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
        this.tournaments.updateCurrentTournament();
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

        fencerListEl.innerHTML = '';

        if (this.fencers.length > 0) {
            const headerRow = document.getElementById("fencersListHeaderTemplate").content.cloneNode(true);

            this.fencers.forEach((_, index) => {
                const headerItemTemplate = document.getElementById("fencersListHeaderItemTemplate").content.cloneNode(true);
                headerItemTemplate.querySelector('.header-item').textContent = index + 1;
                headerRow.querySelector(".header-row").insertBefore(headerItemTemplate, headerRow.querySelector(".results-cell"));
            });
            fencerListEl.appendChild(headerRow);

            // Create match matrix
            this.fencers.forEach((fencer, rowIndex) => {
                const fencerRowWrapper = document.getElementById('fencerRowTemplate').content.cloneNode(true);
                const fencerRow = fencerRowWrapper.querySelector('.fencer-row');
                fencerRow.querySelector('.fencer-name').textContent = fencer.name;

                // Match cells
                this.fencers.forEach((opponent, colIndex) => {

                    const matchCellWrapper = document.getElementById('matchCellTemplate').content.cloneNode(true);
                    const matchCell = matchCellWrapper.querySelector('.match-cell');

                    // Prevent matches against self
                    if (rowIndex === colIndex) {
                        matchCell.textContent = '-';
                    } else {
                        const matchInputWrapper = document.getElementById('matchCellInputTemplate').content.cloneNode(true);
                        const matchInput = matchInputWrapper.querySelector('input');
                        matchInput.dataset.rowIndex = rowIndex;
                        matchInput.dataset.colIndex = colIndex;

                        const match = fencer.matches.find(m => m.opponent === opponent.name);
                        if (match) {
                            matchInput.value = `${match.result.fencerScore}-${match.result.opponentScore}`;
                        }
                        matchInput.addEventListener('change', this.updateMatchResult.bind(this));
                        matchCell.appendChild(matchInput);
                    }

                    fencerRow.appendChild(matchCellWrapper);
                });

                const resultsCell = document.getElementById('fencerResultCellTemplate').content.cloneNode(true);

                // Calculate and display results
                const resultsText = `${fencer.victories}-${fencer.defeats} (${fencer.pointsScored}-${fencer.pointsReceived})`;
                resultsCell.querySelector('.match-result').textContent = resultsText;

                fencerRow.appendChild(resultsCell);
                fencerListEl.appendChild(fencerRow);
            });
        }

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
        this.tournaments.updateCurrentTournament();
    }

    updateResultSummary() {
        const resultSummaryEl = document.getElementById('resultSummary');
        resultSummaryEl.innerHTML = '';

        if (this.fencers.length === 0) {
            document.getElementById('infoMessage').classList.remove('hidden');
        } else {
            document.getElementById('infoMessage').classList.add('hidden');

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

            const summaryTableContent = document.getElementById('summaryTableTemplate').content.cloneNode(true);
            const summaryTableBody = summaryTableContent.getElementById('summaryTableBody');

            sortedFencers.forEach((fencer, index) => {
                const rowTemplate = document.getElementById('summaryTableRowTemplate').content.cloneNode(true);
                rowTemplate.querySelector('.result-rank').textContent = index + 1;
                rowTemplate.querySelector('.result-name').textContent = fencer.name;
                rowTemplate.querySelector('.result-victories').textContent = fencer.victories;
                rowTemplate.querySelector('.result-defeats').textContent = fencer.defeats;
                rowTemplate.querySelector('.result-points').textContent = `${fencer.pointsScored}-${fencer.pointsReceived}`;
                summaryTableBody.appendChild(rowTemplate);
            });

            resultSummaryEl.appendChild(summaryTableContent);
        }
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const tracker = new FencingPoolTracker();
});