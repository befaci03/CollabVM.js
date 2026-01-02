export enum OPCodeServer { // sirbur 2 cilent
    Login = 0,
    QEMU = 2,
    GrabIP = 19
}
export enum OPCodeClient { // cilent 2 sirbur
    Login = 2,
    QEMU = 5,
    Restore = 8,
    Reboot = 10,
    Ban = 12,
    ForceVote = 13,
    Mute = 14,
    Kick = 15,
    EndTurn = 16,
    ClearQueue = 17,
    RenameUser = 18,
    GrabIP = 19,
    BypassTurn = 20,
    XSS = 21,
    ToggleTurns = 22,
    IndefTurn = 23,
    HideScreen = 24,
    SysMsg = 25
}