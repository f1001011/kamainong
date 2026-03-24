<?php
namespace app\controller;

use app\BaseController;
use app\model\Wares as WaresModel;

class Wares extends BaseController
{
    public function list()
    {
        $list = WaresModel::getList();
        return show(1, $list);
    }

    public function detail()
    {
        $id = input('id');
        $detail = WaresModel::where('id', $id)->where('status', 1)->find();

        if (!$detail) {
            return show(0, [], 20001);
        }

        return show(1, $detail);
    }
}
