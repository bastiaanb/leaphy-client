import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RobotType } from '../domain/robot.type';
import { map, filter } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AppState {
    private leaphyOriginalRobotType = new RobotType('Leaphy Original', 'Arduino UNO', 'arduino:avr:uno', 'hex', 'arduino:avr', ['Leaphy Original Extension']);
    private leaphyFlitzRobotType = new RobotType('Leaphy Flitz', 'Arduino UNO', 'arduino:avr:uno', 'hex', 'arduino:avr', ['Leaphy Flitz Extension']);
    private leaphyWiFiRobotType = new RobotType('Leaphy WiFi', 'NodeMCU', 'esp8266:esp8266:nodemcuv2', 'bin', 'esp8266:esp8266', ['Leaphy WiFi Extension'], false);

    constructor() {
        if (window.require) {
            this.isDesktopSubject$ = new BehaviorSubject<boolean>(true);
        } else {
            this.isDesktopSubject$ = new BehaviorSubject<boolean>(false);
        }
        this.isDesktop$ = this.isDesktopSubject$.asObservable();
        this.availableRobotTypes$ = this.isDesktop$
            .pipe(map(isDesktop => {
                if (isDesktop) {
                    return [this.leaphyOriginalRobotType, this.leaphyFlitzRobotType]
                } else {
                    return [this.leaphyWiFiRobotType]
                }
            }));
    }

    private isDesktopSubject$: BehaviorSubject<boolean>;
    public isDesktop$: Observable<boolean>;

    public availableRobotTypes$: Observable<RobotType[]>;

    private selectedRobotTypeSubject$ = new BehaviorSubject<RobotType>(null);
    public selectedRobotType$ = this.selectedRobotTypeSubject$.asObservable();

    public isRobotWired$: Observable<boolean> = this.selectedRobotType$
        .pipe(filter(selectedRobotType => !!selectedRobotType))
        .pipe(map(selectedRobotType => selectedRobotType.isWired));

    public setSelectedRobotType(robotType: RobotType) {
        this.selectedRobotTypeSubject$.next(robotType);
    }
}
