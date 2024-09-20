from datetime import datetime, timedelta

class 物品:
    def __init__(self, 名称, 数量, 种类, 购买日期, 保质期天数):
        self.名称 = 名称
        self.数量 = 数量
        self.种类 = 种类
        self.购买日期 = datetime.strptime(购买日期, "%Y-%m-%d")
        self.到期日期 = self.购买日期 + timedelta(days=保质期天数)
        self.状态 = self.计算状态()

    def 计算状态(self):
        今天 = datetime.now()
        剩余天数 = (self.到期日期 - 今天).days
        if 剩余天数 > 7:
            return "新鲜"
        elif 剩余天数 > 0:
            return "即将过期"
        else:
            return "已过期"

    def __str__(self):
        return f"{self.名称} ({self.种类}): {self.数量} - 状态: {self.状态} - 到期日期: {self.到期日期.strftime('%Y-%m-%d')}"