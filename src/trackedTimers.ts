export class TrackedTimers {
    private readonly _timeouts: NodeJS.Timeout[] = [];
    private readonly _intervals: NodeJS.Timeout[] = [];

    setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timeout {
        const timeout = setTimeout(callback, ms, ...args);
        this._timeouts.push(timeout);
        return timeout;
    }

    setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timeout {
        const interval = setInterval(callback, ms, ...args);
        this._intervals.push(interval);
        return interval;
    }

    clearAll() {
        this._timeouts.forEach(t => clearTimeout(t));
        this._intervals.forEach(i => clearInterval(i));
    }
}