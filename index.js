var sw = 20, //宽
  sh = 20, //高
  tr = 30, //行
  td = 30; //列

var snake = null, //蛇的实例
  food = null, //食物的实例
  game = null; //游戏的实例

//方块构造函数，创建身体，食物
function square(x, y, classname) {
  this.x = x * sw;
  this.y = y * sh;
  this.class = classname;

  this.viewContent = document.createElement("div"); //方块对应的dom元素
  this.viewContent.className = this.class;
  this.parent = document.getElementById("snakeWrap"); //方块的父级
}

square.prototype.create = function () {
  //创建方块dom 并添加到页面里
  this.viewContent.style.position = "absolute";
  this.viewContent.style.width = sw + "px";
  this.viewContent.style.height = sh + "px";
  this.viewContent.style.left = this.x + "px";
  this.viewContent.style.top = this.y + "px";

  this.parent.appendChild(this.viewContent);
};

square.prototype.remove = function () {
  this.parent.removeChild(this.viewContent);
};

function Snake() {
  this.head = null; //存蛇头的信息
  this.tail = null; //蛇尾
  this.pos = [];
  this.directionNum = {
    //存储蛇走的方向，用一个对象表示
    left: {
      x: -1,
      y: 0,
    },
    right: {
      x: 1,
      y: 0,
    },
    up: {
      x: 0,
      y: -1,
    },
    down: {
      x: 0,
      y: 1,
    },
  };
}

Snake.prototype.init = function () {
  //创建蛇头
  var snakeHead = new square(2, 0, "snakeHead");
  snakeHead.create();
  this.head = snakeHead; //存储蛇头信息
  this.pos.push([2, 0]); //把蛇头的位置存起来

  //创建身体1
  var snakeBody1 = new square(1, 0, "snakeBody");
  snakeBody1.create();
  this.pos.push([1, 0]); //把蛇身体的坐标存起来

  //创建身体2
  var snakeBody2 = new square(0, 0, "snakeBody");
  snakeBody2.create();
  this.tail = snakeBody2; //把蛇尾的信息存起来
  this.pos.push([0, 0]); //把蛇身体的坐标存起来

  //形成链表
  snakeHead.last = null;
  snakeHead.next = snakeBody1;

  snakeBody1.last = snakeHead;
  snakeBody1.next = snakeBody2;

  snakeBody2.last = snakeBody1;
  snakeBody2.next = null;

  //给蛇添加一个默认的属性，表示走的方向
  this.direction = this.directionNum.right; //默认走的方向
};

//用来获取蛇头的下要给位置对应的元素，根据元素做不同的事情
Snake.prototype.getNextPos = function () {
  var nextPos = [
    //蛇头走的下一个坐标
    this.head.x / sw + this.direction.x,
    this.head.y / sh + this.direction.y,
  ];
  //下个点是自己身体，游戏结束
  var selfCollied = false; //默认不是撞到自己
  this.pos.forEach(function (value) {
    //遍历数组
    if (value[0] == nextPos[0] && value[1] == nextPos[1]) {
      //如果数组中的两个数据相等，就说明下一个点在自己身上被找到，撞到自己
      selfCollied = true;
    }
  });
  if (selfCollied) {
    this.strategies.die.call(this);
    return;
  }
  // 围墙，游戏结束
  if (
    nextPos[0] < 0 ||
    nextPos[1] < 0 ||
    nextPos[0] > td - 1 ||
    nextPos[1] > tr - 1
  ) {
    this.strategies.die.call(this);
    return;
  }
  //食物，身体加一
  if (food && food.pos[0] == nextPos[0] && food.pos[1] == nextPos[1]) {
    this.strategies.eat.call(this);
    return;
  }
  //null，继续走下去
  this.strategies.move.call(this, nextPos); //重新赋值this
};

//处理碰撞后的事情
Snake.prototype.strategies = {
  move: function (format) {
    //参数决定要不要删除最后一个方块
    //创建一个新的身体，在旧蛇头的位置
    var newBody = new square(this.head.x / sw, this.head.y / sh, "snakeBody");
    //更新链表的关系
    newBody.next = this.head.next;
    newBody.next.last = newBody;
    newBody.last = null;

    this.head.remove();
    newBody.create();

    //创建一个新蛇头
    var newHead = new square(
      this.head.x / sw + this.direction.x,
      this.head.y / sh + this.direction.y,
      "snakeHead"
    );
    newHead.create();

    //更新链表关系
    newHead.next = newBody;
    newHead.last = null;
    newBody.last = newHead;
    newHead.create();

    //蛇身体上的每一个坐标也要更新
    this.pos.splice(0, 0, [
      this.head.x / sw + this.direction.x,
      this.head.y / sh + this.direction.y,
    ]);
    this.head = newHead;

    //删除尾巴
    if (format) {
      //false,表示需要删除
      this.tail.remove();
      this.tail = this.tail.last;
      this.pos.pop();
      console.log(format);
    }
  },
  eat: function () {
    this.strategies.move.call(this);
    createFood();
    game.score++;
  },
  die: function () {
    game.over();
  },
};
snake = new Snake();

//创建食物
function createFood() {
  //食物的坐标值
  var x = null;
  var y = null;

  var include = true; //循环跳出的条件，true表示食物在蛇身上，false表示不在
  while (include) {
    x = Math.round(Math.random() * (td - 1));
    y = Math.round(Math.random() * (tr - 1));

    snake.pos.forEach(function (value) {
      if (value[0] != x && value[1] != y) {
        //表示随机坐标不在蛇身上
        include = false;
      }
    });
  }
  //生成食物
  food = new square(x, y, "food");
  food.pos = [x, y]; //存储食物坐标，与蛇头走的点做对比
  var foodDom = document.querySelector(".food");
  if (foodDom) {
    foodDom.style.left = x * sw + "px";
    foodDom.style.top = y * sh + "px";
  } else {
    food.create();
  }
}

//创建游戏逻辑
function Game() {
  this.timer = null;
  this.score = 0;
}
Game.prototype.init = function () {
  snake.init();
  // snake.getNextPos();
  createFood();
  document.onkeydown = function (ev) {
    if (ev.which == 65 && snake.direction != snake.directionNum.right) {
      snake.direction = snake.directionNum.left;
    } else if (ev.which == 87 && snake.direction != snake.directionNum.down) {
      snake.direction = snake.directionNum.up;
    } else if (ev.which == 68 && snake.direction != snake.directionNum.left) {
      snake.direction = snake.directionNum.right;
    } else if (ev.which == 83 && snake.direction != snake.directionNum.up) {
      snake.direction = snake.directionNum.down;
    }
  };
  this.start();
};
Game.prototype.start = function () {
  //开始游戏定时器
  this.timer = setInterval(function () {
    snake.getNextPos();
  }, 100);
};
Game.prototype.pause = function () {
  clearInterval(this.timer);
};
Game.prototype.over = function () {
  clearInterval(this.timer);
  alert("游戏结束 你的得分为" + this.score);

  //游戏回到初始状态
  var snakeWrap = document.getElementById("snakeWrap");
  snakeWrap.innerHTML = "";
  snake = new Snake();
  sanke = new Game();
  var startBtnWrap = document.querySelector(".startBtn");
  startBtnWrap.style.display = "block";
  this.score = 0;
};

//开始游戏
game = new Game();
var startBtn = document.querySelector(".startBtn button");
startBtn.onclick = function () {
  startBtn.parentNode.style.display = "none";
  game.init();
};

//暂停
var snakeWrap = document.getElementById("snakeWrap");
snakeWrap.onclick = function () {
  game.pause();
  alert("暂停");
  game.start();
};
