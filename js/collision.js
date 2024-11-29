class Collision {
  static checkCircleRect(circle, rect) {
    const distX = Math.abs(circle.x - (rect.x + rect.width / 2));
    const distY = Math.abs(circle.y - (rect.y + rect.height / 2));

    if (distX > rect.width / 2 + circle.radius) return false;
    if (distY > rect.height / 2 + circle.radius) return false;

    if (distX <= rect.width / 2) return true;
    if (distY <= rect.height / 2) return true;

    const dx = distX - rect.width / 2;
    const dy = distY - rect.height / 2;
    return dx * dx + dy * dy <= circle.radius * circle.radius;
  }

  static resolveCircleRect(circle, rect) {
    const hitbox = {
      x: rect.x - circle.radius,
      y: rect.y - circle.radius,
      width: rect.width + circle.radius * 2,
      height: rect.height + circle.radius * 2,
    };

    const closestX = clamp(circle.x, hitbox.x, hitbox.x + hitbox.width);
    const closestY = clamp(circle.y, hitbox.y, hitbox.y + hitbox.height);

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;

    const side = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";

    return {
      hit: true,
      side: side,
      hitPoint: { x: closestX, y: closestY },
    };
  }

  static getCollisionResponse(ball, paddle) {
    const relativeIntersectX = paddle.x + paddle.width / 2 - ball.x;
    const normalizedIntersect = relativeIntersectX / (paddle.width / 2);
    const bounceAngle = (normalizedIntersect * Math.PI) / 3; // 60 degrees max angle

    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    return {
      dx: -speed * Math.sin(bounceAngle),
      dy: -speed * Math.cos(bounceAngle),
    };
  }
}
