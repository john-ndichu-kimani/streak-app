class ApiService {
    private apiUrl: string;

    constructor(apiUrl: string) {
        this.apiUrl = apiUrl;
    }

    async postHabit(habit: { name: string, completeDate: string, habitNameIcon: string }): Promise<void> {
        const response = await fetch(`${this.apiUrl}/habits`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(habit),
        });

        if (!response.ok) {
            throw new Error('Failed to post habit');
        }
    }

    async fetchHabits(): Promise<{ name: string, completeDate: string, habitNameIcon: string, streak: number }[]> {
        const response = await fetch(`${this.apiUrl}/habits`);

        if (!response.ok) {
            throw new Error('Failed to fetch habits');
        }

        const data = await response.json();
        return data;
    }

    async updateHabitStreak(name: string): Promise<void> {
        const response = await fetch(`${this.apiUrl}/habits/streak`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        });

        if (!response.ok) {
            throw new Error('Failed to update streak');
        }
    }
}

class HabitManager {
    private habitsContainer: HTMLElement;
    private apiService: ApiService;
    private habits: { name: string, completeDate: string, habitNameIcon: string, streak: number }[] = [];

    constructor(habitsContainerId: string, apiService: ApiService) {
        const container = document.querySelector(habitsContainerId);
        if (!container) {
            throw new Error(`No element found with id ${habitsContainerId}`);
        }
        this.habitsContainer = container as HTMLElement;
        this.apiService = apiService;
    }

    async addHabit(habit: { name: string, completeDate: string, habitNameIcon: string }): Promise<void> {
        await this.apiService.postHabit(habit);
        await this.loadHabits();
    }

    async loadHabits(): Promise<void> {
        this.habits = await this.apiService.fetchHabits();
        this.renderHabits();
    }

    async updateHabitStreak(name: string): Promise<void> {
        await this.apiService.updateHabitStreak(name);
        await this.loadHabits();
    }

    private renderHabits(): void {
        this.habitsContainer.innerHTML = '';
        const today = new Date().getTime();

        this.habits.forEach(habit => {
            const habitElement = document.createElement('div');
            habitElement.className = 'habit';

            const completeDate = new Date(habit.completeDate).getTime();
            const daysPassed = Math.floor((today - completeDate) / (1000 * 60 * 60 * 24));

            habitElement.innerHTML = `
                <ion-icon name="${habit.habitNameIcon}-outline" class="card-icon"></ion-icon>
                <h3>${habit.name}</h3>
                <p>Stop Date: ${habit.completeDate}</p>
                <p>Streak: ${daysPassed} days</p>
                <button class="update-streak" data-name="${habit.name}">Update Streak</button>
            `;

            const updateButton = habitElement.querySelector('.update-streak') as HTMLButtonElement;
            updateButton.addEventListener('click', () => this.updateHabitStreak(habit.name));

            this.habitsContainer.appendChild(habitElement);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'http://localhost:3000';
    const apiService = new ApiService(apiUrl);
    const habitManager = new HabitManager('.activities', apiService);

    // Load initial habits
    habitManager.loadHabits();

    const modalOverlay = document.querySelector('.modal-overlay') as HTMLDivElement;
    const form = document.querySelector('.habit-form') as HTMLFormElement;
    const btn = document.querySelector('.plus') as HTMLButtonElement;
    const span = document.querySelector('.close') as HTMLSpanElement;

    btn.addEventListener('click', () => {
        modalOverlay.style.display = 'block';
    });

    span.addEventListener('click', () => {
        modalOverlay.style.display = 'none';
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const nameInput = document.getElementById('name') as HTMLInputElement;
        const completeDateInput = document.getElementById('complete-date') as HTMLInputElement;
        const habitNameIconInput = document.getElementById('habit-icon') as HTMLInputElement;

        const habit = {
            name: nameInput.value.trim(),
            completeDate: completeDateInput.value.trim(),
            habitNameIcon: habitNameIconInput.value.trim(),
        };

        if (habit.name && habit.completeDate && habit.habitNameIcon) {
            await habitManager.addHabit(habit);
            form.reset();
            modalOverlay.style.display = 'none';
        }
    });
});
