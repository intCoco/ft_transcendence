import { Ball } from "../entities/ball.js";

export interface GameModifiers {
    increaseSpeed: boolean;
    paddleBounceAngle: boolean;
    spin: boolean;
    arena: boolean;
}

export interface GameConfig {
    modifiers: GameModifiers;
}

export const gameConfig: GameConfig = {
    modifiers: {
        increaseSpeed: false,
        paddleBounceAngle: false,
        spin: false,
        arena: false
    }
};

// export function displayActiveModifiers() {
//     const mods: string[] = [];

//     if (gameConfig.modifiers.increaseSpeed) mods.push("Speed");
//     if (gameConfig.modifiers.paddleBounceAngle) mods.push("Angle");
//     if (gameConfig.modifiers.spin) mods.push("Spin");
//     if (gameConfig.modifiers.arena) mods.push("Arena");

//     // document.getElementById("active-mods")!.innerText =
//     //     mods.length ? "Mods: " + mods.join(", ") : "Mods: none";
// }


/**
 * Make the ball bounce at a given angle without changing speed
 * @param ball
 * @param angle Angle wanted in radians
 */
export function bounce(ball: Ball, angle: number, axis: "vertical" | "horizontal") {
    const speed = Math.hypot(ball.velX, ball.velY);

    if (axis === "vertical") {
        const dirX = Math.sign(ball.velX);

        ball.velX = Math.cos(angle) * speed * dirX;
        ball.velY = Math.sin(angle) * speed;
    } else {
        const dirY = Math.sign(ball.velY);

        ball.velX = Math.sin(angle) * speed;
        ball.velY = Math.cos(angle) * speed * dirY;
    }
}